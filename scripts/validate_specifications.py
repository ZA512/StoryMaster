#!/usr/bin/env python3
"""Valide le dossier de conception, sans serveur ni accès réseau.

Usage CI : python scripts/validate_specifications.py [--root CHEMIN]
Le code de sortie vaut 1 au premier écart, 2 si une dépendance manque.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import yaml
    from jsonschema import Draft202012Validator, FormatChecker
    from openapi_spec_validator import validate
    from jsonschema.exceptions import SchemaError
except ImportError as exc:
    print(f"Dépendance absente : {exc}. Installer scripts/requirements-validation.txt.", file=sys.stderr)
    sys.exit(2)


class InvalidSpecification(ValueError):
    """Écart documentaire ou contractuel avec localisation exploitable en CI."""


def require(condition, message):
    if not condition:
        raise InvalidSpecification(message)


def unique_mapping(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f"Clé dupliquée : {key}")
        result[key] = value
    return result


def load_json(path):
    def reject_constant(value):
        raise InvalidSpecification(f"Constante JSON interdite : {value}")

    try:
        return json.loads(path.read_text(), object_pairs_hook=unique_mapping,
                          parse_constant=reject_constant)
    except (ValueError, OSError) as exc:
        raise InvalidSpecification(f"{path}: {exc}") from exc


class UniqueLoader(yaml.SafeLoader):
    pass


def yaml_mapping(loader, node):
    loader.flatten_mapping(node)
    return unique_mapping(loader.construct_pairs(node, deep=True))


UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, yaml_mapping)


def load_yaml(path):
    try:
        return yaml.load(path.read_text(), Loader=UniqueLoader)
    except (ValueError, OSError, yaml.YAMLError) as exc:
        raise InvalidSpecification(f"{path}: {exc}") from exc


FAMILIES = "OBJ|MOD|PROJ|EDIT|DATA|SEARCH|EXPORT|COLLAB|AI-SEC|AI|PROP|CRIT|UX|SEC|NFR"
ID_PATTERN = rf"(?:{FAMILIES})-\d{{2}}"


def requirement_type(identifier):
    family = identifier.rsplit("-", 1)[0]
    return {"OBJ": "objective", "NFR": "non_functional", "SEC": "security",
            "AI-SEC": "security", "UX": "usability"}.get(family, "functional")


def extract_prd(path):
    """Relit les définitions, et non les mentions d'IDs ailleurs dans le PRD.

    Distingue les colonnes ID/exigence/priorité et ID/domaine/exigence cible.
    Une priorité absente reste None ; aucune recommandation ne devient MUST.
    """
    result = {}
    section = parent = ""
    table = re.compile(rf"^\| ({ID_PATTERN}) \| (.*?) \| (.*?) \|$")
    prose = re.compile(rf"^\*\*({ID_PATTERN}) — (.*?)\s*:\*\*\s*(.*)$")
    for line in path.read_text().splitlines():
        if line.startswith("## "):
            parent = section = line[3:].strip()
        elif line.startswith("### "):
            section = line[4:].strip()
        match = table.fullmatch(line.strip())
        domain = None
        if match:
            identifier, middle, last = match.groups()
            if identifier.startswith("NFR-"):
                domain, text, marker = middle, last, ""
            else:
                text, marker = middle, last
        else:
            match = prose.fullmatch(line.strip())
            if not match:
                continue
            identifier, marker, text = match.groups()
        require(identifier not in result, f"PRD : définition dupliquée {identifier}")
        priority = re.search(r"\b(MUST|SHOULD|COULD)\b", marker)
        if "V2+" in marker or "V1" in marker:
            version, basis = ("V2+" if "V2+" in marker else "V1"), "explicit"
        elif identifier == "OBJ-11":
            version, basis = "V1", "cross_reference"
        elif "V1" in section:
            version, basis = "V1", "section"
        else:
            version = "MVP"
            basis = "section" if "MVP" in section or "MVP" in parent else "proposed_mvp"
        result[identifier] = {
            "id": identifier, "requirementType": requirement_type(identifier),
            "priority": priority.group(1) if priority else None,
            "targetVersion": version, "targetVersionBasis": basis,
            "text": text, "domain": domain, "section": section,
            "sourceText": line.strip(),
        }
    require(result, "PRD : aucune définition reconnue")
    return result


def rows_by_id(path, prefix):
    result = {}
    for line in path.read_text().splitlines():
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if not line.startswith("| "):
            continue
        if re.fullmatch(prefix + r"[A-Z]+(?:-[A-Z]+)?-\d{2}", cells[0]):
            require(re.fullmatch(prefix + ID_PATTERN, cells[0]), f"{path}: famille inconnue {cells[0]}")
        if re.fullmatch(prefix + ID_PATTERN, cells[0]):
            require(cells[0] not in result, f"{path}: ligne dupliquée {cells[0]}")
            result[cells[0]] = cells
    return result


def same_keys(actual, expected, context):
    missing, extra = set(expected) - set(actual), set(actual) - set(expected)
    require(not missing and not extra,
            f"{context}: absents={sorted(missing)}, inattendus={sorted(extra)}")


def schema_validate(schema, instance, context):
    errors = sorted(Draft202012Validator(schema, format_checker=FormatChecker())
                    .iter_errors(instance), key=lambda e: str(list(e.path)))
    if errors:
        first = errors[0]
        raise InvalidSpecification(f"{context} {list(first.path)}: {first.message}")


def validate_requirements(root):
    registry = load_json(root / "docs/spec/requirements.json")
    schema = load_json(root / "docs/spec/requirements.schema.json")
    schema_validate(schema, registry, "requirements.json")
    require(registry["source"] == "docs/PRD.md", "Source du registre inattendue")
    source = extract_prd(root / registry["source"])
    requirements = registry["requirements"]
    by_id = {item["id"]: item for item in requirements}
    require(len(by_id) == len(requirements), "Registre : IDs dupliqués")
    same_keys(by_id, source, "Registre ↔ définitions du PRD")
    backlog = rows_by_id(root / "docs/IMPLEMENTATION-PLAN.md", "BL-")
    trace = rows_by_id(root / "docs/RESEARCH-TRACEABILITY.md", "")
    same_keys(backlog, {"BL-" + key for key in source}, "Backlog ↔ PRD")
    same_keys(trace, source, "Traçabilité ↔ PRD")
    titles = re.findall(r"^### Lot (\d+) — (.+)$",
                        (root / "docs/IMPLEMENTATION-PLAN.md").read_text(), re.M)
    require(titles == list(enumerate_lot_titles()), "Titres/ordre des huit lots incorrects")
    plan = (root / "docs/IMPLEMENTATION-PLAN.md").read_text()
    for number, _ in enumerate_lot_titles():
        block = plan.split(f"### Lot {number} — ", 1)[1].split("### Lot ", 1)[0]
        assigned = re.search(r"\*\*Exigences PRD couvertes :\*\* (.*?)\. Les exigences", block)
        require(assigned, f"Lot {number}: liste d'exigences absente")
        identifiers = assigned.group(1).split(", ")
        require(len(identifiers) == len(set(identifiers)), f"Lot {number}: exigences dupliquées")
        same_keys(identifiers, {key for key, item in by_id.items() if item["lot"] == int(number)},
                  f"Lot {number} ↔ affectations du registre")
    for identifier, item in by_id.items():
        for field, value in source[identifier].items():
            require(item[field] == value, f"{identifier}.{field}: divergent du PRD ({value!r})")
        row = backlog["BL-" + identifier]
        require(len(row) == 10, f"Backlog {identifier}: colonnes incorrectes")
        displayed_lot = str(item["lot"]) if item["lot"] is not None else item["targetVersion"]
        require(row[1:6] == [item["text"], identifier, displayed_lot,
                             item["deliveryPriority"], item["targetVersion"]],
                f"Backlog {identifier}: texte, ID, lot, priorité ou version divergents")
        require(row[8] and row[9].startswith(("Proposé", "Validé")), f"Backlog {identifier}: AC/statut manquant")
        tr = trace[identifier]
        priority = item["priority"] or "non spécifiée"
        require(len(tr) == 12 and tr[1] == item["text"] and tr[7] == item["targetVersion"],
                f"Traçabilité {identifier}: texte/version divergents")
        require(tr[4] == "§" + item["section"], f"Traçabilité {identifier}: section divergente")
        require(tr[6].split(" (")[0] == f"{item['deliveryPriority']} / {priority}",
                f"Traçabilité {identifier}: priorité divergente")
        require(tr[8] in {"confirmé", "partiel", "contradiction", "non couvert", "à décider"},
                f"Traçabilité {identifier}: statut inconnu")
        if item["lot"] is not None:
            block = plan.split(f"### Lot {item['lot']} — ", 1)[1].split("### Lot ", 1)[0]
            assigned = re.search(r"\*\*Exigences PRD couvertes :\*\* (.*?)\. Les exigences", block)
            require(assigned and identifier in assigned.group(1).split(", "),
                    f"{identifier}: absent des exigences détaillées du lot {item['lot']}")
    return by_id


def enumerate_lot_titles():
    return [(str(number), title) for number, title in enumerate([
        "Fondations", "Manuscrit et éditeur", "Référentiel narratif",
        "Collaboration asynchrone", "Propositions", "Assistant IA intégré",
        "MCP externe", "Consolidation / production",
    ])]


def walk(value):
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def pointer(document, reference):
    require(reference.startswith("#/"), f"$ref non locale interdite en CI hors réseau : {reference}")
    current = document
    try:
        for token in reference[2:].split("/"):
            current = current[token.replace("~1", "/").replace("~0", "~")]
    except (KeyError, TypeError) as exc:
        raise InvalidSpecification(f"$ref introuvable : {reference}") from exc
    return current


def check_references(document, context):
    for node in walk(document):
        if isinstance(node, dict) and "$ref" in node:
            try:
                pointer(document, node["$ref"])
            except InvalidSpecification as exc:
                raise InvalidSpecification(f"{context}: {exc}") from exc


def normalized(value):
    if isinstance(value, dict):
        return {key: (item.replace("#/components/schemas/", "#/$defs/")
                      if key == "$ref" else normalized(item)) for key, item in value.items()}
    if isinstance(value, list):
        return [normalized(item) for item in value]
    return value


MCP_OPERATIONS = {
    "project_list": ("projectList", "projects:read"),
    "project_get_context": ("projectGetContext", "project:read"),
    "entity_search": ("entitySearch", "project:read"),
    "entity_get": ("entityGet", "project:read"),
    "scene_read": ("sceneRead", "project:read"),
    "relation_list": ("relationList", "project:read"),
    "timeline_list": ("timelineList", "project:read"),
    "proposal_create": ("proposalCreate", "proposal:write"),
    "proposal_set_operations": ("proposalSetOperations", "proposal:write"),
    "proposal_preview": ("proposalPreview", "proposal:read"),
    "proposal_validate": ("proposalValidate", "proposal:read"),
    "proposal_submit": ("proposalSubmit", "proposal:submit"),
    "proposal_get": ("proposalGet", "proposal:read"),
}


def dereference(oas, value):
    return pointer(oas, value["$ref"]) if "$ref" in value else value


def http_arguments(oas, path, operation):
    properties, required = {}, set()
    parameters = oas["paths"][path].get("parameters", []) + operation.get("parameters", [])
    for parameter in parameters:
        parameter = dereference(oas, parameter)
        name = parameter["name"]
        if parameter["in"] in {"path", "query"}:
            properties[name] = normalized(parameter["schema"])
        elif name == "Idempotency-Key":
            name = "idempotencyKey"
            properties[name] = parameter["schema"]
        elif name == "If-Match":
            name = "expectedStateVersion"
            properties[name] = {"type": "integer", "minimum": 1}
        else:
            continue
        if parameter.get("required"):
            required.add(name)
    if "requestBody" in operation:
        body = dereference(oas, operation["requestBody"]["content"]["application/json"]["schema"])
        properties.update(normalized(body["properties"]))
        required.update(body["required"])
    return properties, required


def validate_lot0(oas):
    expected = {
        'projectList': ('/projects', 'get'), 'projectCreate': ('/projects', 'post'),
        'projectGet': ('/projects/{projectId}', 'get'),
        'projectUpdate': ('/projects/{projectId}', 'patch'),
        'projectArchive': ('/projects/{projectId}/archive', 'post'),
        'projectRestore': ('/projects/{projectId}/restore', 'post'),
        'identityGet': ('/me', 'get'), 'sessionLogout': ('/session/logout', 'post'),
        'oidcStart': ('/auth/login', 'get'), 'oidcCallback': ('/auth/callback', 'get'),
    }
    for oid, (path, method) in expected.items():
        op = oas['paths'].get(path, {}).get(method, {})
        require(op.get('operationId') == oid and op.get('x-lot') == 0,
                f'Lot 0 : route/opération manquante {oid}')
        require(op.get('security') == ([] if oid.startswith('oidc') else [{'webSession': []}]),
                f'Lot 0 : sécurité de session divergente {oid}')
        if method in {'post', 'patch'}:
            params = [dereference(oas, p) for p in op.get('parameters', [])]
            by_name = {p['name']: p for p in params}
            require(by_name.get('X-CSRF-Token', {}).get('required') is True,
                    f'Lot 0 : CSRF obligatoire {oid}')
            if oid in {'projectUpdate', 'projectArchive', 'projectRestore'}:
                require(by_name.get('If-Match', {}).get('required') is True and
                        by_name['If-Match']['schema'].get('pattern') == '^"r[1-9][0-9]*"$',
                        f'Lot 0 : précondition forte obligatoire {oid}')
            if oid in {'projectCreate', 'projectArchive', 'projectRestore'}:
                require(by_name.get('Idempotency-Key', {}).get('required') is True,
                        f'Lot 0 : idempotence obligatoire {oid}')
    schemas = oas['components']['schemas']
    project = schemas['Project']
    require(project['additionalProperties'] is False and
            set(project['required']) == {'id', 'name', 'description', 'language', 'status',
                                        'visibility', 'revision', 'role', 'createdAt', 'updatedAt'},
            'Lot 0 : DTO Project divergent')
    require(project['properties']['role']['enum'] == ['owner', 'admin', 'author', 'reviewer', 'reader']
            and project['properties']['visibility'] == {'const': 'private'},
            'Lot 0 : rôle ou visibilité divergents')
    for name in ['ProjectCreate', 'ProjectUpdate', 'EmptyBody']:
        require(schemas[name].get('additionalProperties') is False,
                f'Lot 0 : corps doit refuser les propriétés inconnues {name}')
    require(set(schemas['ProjectCreate']['properties']) == {'name', 'description', 'language'} and
            set(schemas['ProjectUpdate']['properties']) == {'set'},
            'Lot 0 : rôle client interdit dans le corps')


def validate_lot1(oas):
    base = '/projects/{projectId}'
    expected = {'manuscriptOutline': (base+'/manuscripts','get')}
    for kind, plural, parent in [('manuscript','manuscripts',base),('chapter','chapters',base+'/manuscripts/{manuscriptId}'),('scene','scenes',base+'/chapters/{chapterId}')]:
        expected[kind+'Create'] = (parent+'/'+plural,'post')
        path = base+'/'+plural+'/{'+kind+'Id}'
        for suffix, method in [('Update','patch'),('Move','post'),('Archive','post')]:
            expected[kind+suffix] = (path+('' if suffix=='Update' else '/'+suffix.lower()),method)
    scene = base+'/scenes/{sceneId}'
    for oid, suffix, method in [('sceneRead','','get'),('sceneContentSave','/content','put'),('sceneRevisionList','/revisions','get'),('sceneRevisionGet','/revisions/{revision}','get'),('sceneCompare','/compare','get'),('sceneRestore','/restore','post')]:
        expected[oid] = (scene+suffix,method)
    expected['manuscriptExport'] = (base+'/manuscripts/{manuscriptId}/export','get')
    for oid, (path, method) in expected.items():
        op = oas['paths'].get(path,{}).get(method,{})
        require(op.get('operationId')==oid and op.get('x-lot')==1, 'Lot 1 : opération absente '+oid)
        require(op.get('security')==[{'webSession':[]}], 'Lot 1 : session humaine obligatoire '+oid)
        if method in {'post','put','patch'}:
            params = {p['name']:p for raw in op.get('parameters',[]) for p in [dereference(oas,raw)]}
            for name in ['X-CSRF-Token','Idempotency-Key'] + (['If-Match'] if oid in {'sceneContentSave','sceneRestore'} else []):
                require(params.get(name,{}).get('required') is True, 'Lot 1 : précondition absente '+oid+' '+name)
            schema = dereference(oas,op['requestBody']['content']['application/json']['schema'])
            require(schema.get('additionalProperties') is False, 'Lot 1 : corps strict '+oid)
            if oid.endswith(('Update','Move','Archive')):
                require('expectedRevision' in schema['required'], 'Lot 1 : CAS requis '+oid)
            if oid.endswith('Create'):
                require('expectedStructureRevision' in schema['required'], 'Lot 1 : CAS parent requis '+oid)
            if oid.endswith('Move'):
                require({'expectedSourceStructureRevision','expectedTargetStructureRevision'}.issubset(schema['required']), 'Lot 1 : deux parents requis '+oid)
    schemas = oas['components']['schemas']
    require(schemas['SceneContentSave']['properties']['contentFormatVersion']=={'type':'number','const':1}, 'Lot 1 : format éditeur versionné')
    require(schemas['SceneRevision']['properties']['content']=={'$ref':'#/components/schemas/RichDocument'}, 'Lot 1 : snapshot riche intégral')
    require('position' not in schemas['Scene']['properties'], 'Lot 1 : ordre porté par le plan, pas CAS texte voisin')


def validate_contracts(root):
    oas = load_yaml(root / "docs/spec/openapi.yaml")
    check_references(oas, "OpenAPI")  # Avant le validateur pour interdire tout fetch implicite.
    require(oas["openapi"] == "3.1.1", "Version OpenAPI inattendue")
    try:
        validate(oas)
    except Exception as exc:
        raise InvalidSpecification(f"OpenAPI invalide : {exc}") from exc
    validate_lot0(oas)
    validate_lot1(oas)
    operations_schema = load_json(root / "docs/spec/operations.schema.json")
    for name, definition in operations_schema["$defs"].items():
        require(name in oas["components"]["schemas"] and
                definition == normalized(oas["components"]["schemas"][name]),
                f"operations.schema.json ↔ OpenAPI : définition {name} divergente")
    operations = {}
    for path, item in oas["paths"].items():
        for method, operation in item.items():
            if method not in {"get", "post", "put", "patch", "delete"}:
                continue
            oid = operation["operationId"]
            require(oid not in operations, f"operationId HTTP dupliqué : {oid}")
            operations[oid] = (path, method, operation)
    catalog = load_json(root / "docs/spec/mcp-tools.json")
    policy = load_json(root / "docs/spec/mcp-policy.json")
    require(catalog.get("resultType") == "complete", "MCP tools/list : resultType incorrect")
    require(policy.get("protocolVersion") == "2026-07-28", "Version MCP divergente")
    tools = {tool["name"]: tool for tool in catalog["tools"]}
    policies = {item["name"]: item for item in policy["tools"]}
    require(len(tools) == len(catalog["tools"]), "Outils MCP dupliqués")
    require(len(policies) == len(policy["tools"]), "Politiques MCP dupliquées")
    same_keys(tools, MCP_OPERATIONS, "Noms des outils MCP autorisés")
    same_keys(policies, tools, "Catalogue ↔ politique MCP")
    error_codes = set(oas["components"]["schemas"]["ErrorResponse"]["properties"]["error"]
                      ["properties"]["code"]["enum"])
    for name, tool in tools.items():
        p = policies[name]
        oid, scope = MCP_OPERATIONS[name]
        require(p["httpOperationId"] == oid and oid in operations, f"{name}: mapping HTTP incorrect")
        path, method, operation = operations[oid]
        require(p["scope"] == scope, f"{name}: scope incorrect")
        require(p["permission"] == operation["x-permission"], f"{name}: permission HTTP/MCP divergente")
        require(p["audit"] == operation["x-audit"], f"{name}: audit HTTP/MCP divergent")
        read = method == "get" or name in {"proposal_preview", "proposal_validate"}
        require(p["transaction"] == ("TX0" if read else "TX1"), f"{name}: transaction divergente")
        require(tool["annotations"]["readOnlyHint"] is read, f"{name}: readOnlyHint incorrect")
        require(p["additionalScopes"] == ([] if name == "project_list" else ["project:read"]),
                f"{name}: scopes supplémentaires incorrects")
        require(p["errors"] and set(p["errors"]) <= error_codes, f"{name}: code d'erreur inconnu")
        for field in ["description", "inputSchema", "outputSchema"]:
            require(tool.get(field), f"{name}: {field} absent")
        for field in ["effects", "idempotency", "projectBoundary", "actor", "ownership"]:
            require(p.get(field), f"{name}: politique {field} absente")
        for side in ["inputSchema", "outputSchema"]:
            schema = tool[side]
            check_references(schema, f"{name}.{side}")
            Draft202012Validator.check_schema(schema)
            for key, definition in schema.get("$defs", {}).items():
                require(key in oas["components"]["schemas"] and
                        definition == normalized(oas["components"]["schemas"][key]),
                        f"{name}.{side}.$defs.{key}: définition HTTP/MCP divergente")
        expected_properties, expected_required = http_arguments(oas, path, operation)
        inp = tool["inputSchema"]
        require(inp["properties"] == expected_properties and set(inp["required"]) == expected_required
                and inp.get("additionalProperties") is False, f"{name}: entrée HTTP/MCP divergente")
        response = next(value for key, value in operation["responses"].items() if key.startswith("2"))
        response_schema = response["content"]["application/json"]["schema"]
        require(tool["outputSchema"]["properties"]["data"] ==
                normalized(response_schema["properties"]["data"]), f"{name}: sortie HTTP/MCP divergente")
        require(tool["outputSchema"]["properties"]["error"] ==
                oas["components"]["schemas"]["ErrorResponse"]["properties"]["error"],
                f"{name}: erreur HTTP/MCP divergente")
        # Vérifie l'enveloppe, pas seulement les schémas nommés qu'elle embarque.
        output = tool["outputSchema"]
        require(output.get("additionalProperties") is False, f"{name}: sortie non bornée")
        schema_validate(output, {"error": {"code": "NOT_FOUND", "message": "Absent",
                        "correlationId": "req_validation", "retryable": False}}, name + ": erreur")
        require(list(Draft202012Validator(output).iter_errors({})) and
                list(Draft202012Validator(output).iter_errors({"data": {}, "error": {}})),
                f"{name}: sortie doit contenir data OU error")
        if "limit" in inp["properties"]:
            require(p["limits"]["maxPageSize"] == inp["properties"]["limit"]["maximum"],
                    f"{name}: limite pagination divergente")
        if "operations" in inp["properties"]:
            require(p["limits"]["maxOperations"] == inp["properties"]["operations"]["maxItems"],
                    f"{name}: limite opérations divergente")
    validate_fixtures(root, oas, tools)
    validate_lot0_examples(root, oas)
    return oas, tools


def validate_lot0_examples(root, oas):
    examples = [example for name in ['lot0-http.json','lot1-http.json'] for example in load_json(root / 'docs/examples' / name)['responses']]
    for example in examples:
        op = oas['paths'][example['path']][example['method']]
        context = 'Lot 0 exemple : ' + example['path']
        if 'requestBody' in op:
            schema = op['requestBody']['content']['application/json']['schema']
            schema_validate({**schema, 'components': oas['components']},
                            example['request']['body'], context)
        for p in op.get('parameters', []):
            p = dereference(oas, p)
            if p['in'] == 'header' and p.get('required'):
                require(p['name'] in example['request']['headers'], context + ': header absent')
                schema_validate(p['schema'], example['request']['headers'][p['name']], context)
        response = dereference(oas, op['responses'][str(example['status'])])
        schema = response['content']['application/json']['schema']
        schema_validate({**schema, 'components': oas['components']}, example['response'], context)


def validate_fixtures(root, oas, tools):
    schema = load_json(root / "docs/spec/operations.schema.json")

    def validate_resource(name, instance):
        schema_validate({"$ref": "#/components/schemas/" + name,
                         "components": oas["components"]}, instance, name)

    for path in sorted((root / "docs/examples/proposals").glob("*.json")):
        fixture = load_json(path)
        versions = {resource["id"]: resource["revision"]
                    for group in ["objects", "scenes", "relations"]
                    for resource in fixture["initialState"].get(group, [])}
        for operation in fixture["createRequest"]["body"]["operations"]:
            if "targetId" in operation:
                require(operation["targetId"] in versions and
                        operation["expectedRevision"] == versions[operation["targetId"]],
                        f"{path.name}: expectedRevision initiale incohérente")
        if "revisionRequest" in fixture:
            changed = fixture["concurrentChange"]["resourceAfter"]
            versions[changed["id"]] = changed["revision"]
            for operation in fixture["revisionRequest"]["body"]["operations"]:
                if "targetId" in operation:
                    require(operation["expectedRevision"] == versions.get(operation["targetId"]),
                            f"{path.name}: expectedRevision révisée incohérente")
        for node in walk(fixture):
            if not isinstance(node, dict):
                continue
            if "operationId" in node and "kind" in node:
                schema_validate(schema, node, f"{path.name}: opération")
            if "method" in node and "path" in node:
                request_path = node["path"].removeprefix("/api/v1")
                matches = [item[node["method"].lower()] for pattern, item in oas["paths"].items()
                           if re.fullmatch(re.sub(r"\{[^}]+\}", "[^/]+", pattern), request_path)
                           and node["method"].lower() in item]
                require(len(matches) == 1, f"{path.name}: route HTTP inconnue {request_path}")
                operation = matches[0]
                if "requestBody" in operation:
                    ref = operation["requestBody"]["content"]["application/json"]["schema"]
                    schema_validate({**ref, "components": oas["components"]}, node.get("body"),
                                    f"{path.name}: corps {request_path}")
                for param in operation.get("parameters", []):
                    param = dereference(oas, param)
                    if param["in"] == "header" and param.get("required"):
                        require(param["name"] in node.get("headers", {}),
                                f"{path.name}: header absent {param['name']}")
                        schema_validate(param["schema"], node["headers"][param["name"]], request_path)
            if "data" in node and isinstance(node["data"], dict):
                data = node["data"]
                name = ("MergeResult" if "proposalStatus" in data else "Preview" if "diffs" in data
                        else "Proposal" if "operations" in data and "proposalRevision" in data else None)
                if name:
                    validate_resource(name, data)
            if "error" in node and set(node) == {"error"}:
                validate_resource("ErrorResponse", node)
        body = fixture["createRequest"]["body"]
        schema_validate(tools["proposal_create"]["inputSchema"],
                        {"projectId": "prj_demo", **body,
                         "idempotencyKey": fixture["createRequest"]["headers"]["Idempotency-Key"]},
                        path.name + ": MCP create")
        for state_name in ["initialState", "stateAfterResolution", "finalState"]:
            state = fixture.get(state_name, {})
            for collection, name in [("objects", "Entity"), ("scenes", "Scene"), ("relations", "Relation")]:
                for resource in state.get(collection, []):
                    validate_resource(name, resource)
        if "temporaryIdResolution" in fixture:
            validate_creation_mapping(fixture, path.name)
            schema_validate(tools["proposal_preview"]["outputSchema"], fixture["previewResponse"], path.name)
        if "revisionResponse" in fixture:
            revise = fixture["revisionRequest"]["body"]
            old = fixture["firstApproval"]["approvedProposalRevision"]
            new = fixture["revisionResponse"]["proposalRevision"]
            require(new == old + 1 and revise["expectedProposalRevision"] == old,
                    f"{path.name}: progression des révisions de proposition incohérente")
            require(all(review["validity"] == "invalidated" and review["proposalRevision"] == old
                        for review in fixture["revisionResponse"]["reviews"]),
                    f"{path.name}: ancienne approbation non invalidée")
            require(fixture["resubmission"]["effectiveApprovals"] == 0 and
                    fixture["secondApproval"]["approvedProposalRevision"] == new,
                    f"{path.name}: resoumission/réapprobation incohérente")
            error = fixture["failedMerge"]["body"]["error"]
            require(error["code"] in {"PROPOSAL_CONFLICT", "REVISION_CONFLICT"},
                    f"{path.name}: code de conflit incorrect")
            before, after = fixture["concurrentChange"]["resourceBefore"], fixture["concurrentChange"]["resourceAfter"]
            conflict = error["details"]["conflicts"][0]
            require(conflict["resourceId"] == before["id"] == after["id"] and
                    conflict["expectedRevision"] == before["revision"] and
                    conflict["currentRevision"] == after["revision"], f"{path.name}: conflit incohérent")
            require(fixture["failedMerge"]["assertions"]["mergeChangeSetsCreated"] == 0 and
                    fixture["failedMerge"]["assertions"]["mergeOutboxEventsCreated"] == 0,
                    f"{path.name}: oracle rollback incohérent")
            validate_final_revisions(fixture, fixture["successfulMerge"]["response"]["data"], "finalState")


def validate_creation_mapping(fixture, context):
    merge = fixture["mergeResponse"]["data"]
    mapping = fixture["temporaryIdResolution"]["mapping"]
    operations = fixture["createRequest"]["body"]["operations"]
    temporary = [op["tempId"] for op in operations if "tempId" in op]
    require(len(set(temporary)) == len(temporary), f"{context}: tempId dupliqué")
    same_keys(mapping, temporary, context + ": mapping créations")
    require(mapping == merge["temporaryIds"] and len(set(mapping.values())) == len(mapping),
            f"{context}: mapping de merge divergent ou IDs définitifs dupliqués")

    def resolve(value):
        if isinstance(value, dict):
            if set(value) == {"tempId"}:
                require(value["tempId"] in mapping, f"{context}: référence temporaire inconnue")
                return {"id": mapping[value["tempId"]]}
            return {key: resolve(child) for key, child in value.items()}
        return [resolve(child) for child in value] if isinstance(value, list) else value

    require(resolve(operations) == fixture["temporaryIdResolution"]["resolvedOperations"],
            f"{context}: opérations résolues divergentes")
    final_ids = {res["id"] for key in ["objects", "scenes", "relations"]
                 for res in fixture["stateAfterResolution"].get(key, [])}
    require(set(mapping.values()) <= final_ids, f"{context}: création absente de l'état final")
    require(fixture["expectedAudit"]["changeEventCount"] == len(merge["resourceRevisions"]) and
            fixture["expectedAudit"]["changeSetCount"] == 1, f"{context}: oracle audit incohérent")
    validate_final_revisions(fixture, merge, "stateAfterResolution")


def validate_final_revisions(fixture, merge, state_name):
    # La modification concurrente est la nouvelle base du second exemple.
    initial = {res["id"]: res["revision"] for key in ["objects", "scenes", "relations"]
               for res in fixture["initialState"].get(key, [])}
    if "concurrentChange" in fixture:
        res = fixture["concurrentChange"]["resourceAfter"]
        initial[res["id"]] = res["revision"]
    final = {res["id"]: res["revision"] for key in ["objects", "scenes", "relations"]
             for res in fixture[state_name].get(key, [])}
    actual = {res["resourceId"]: res["revision"] for res in merge["resourceRevisions"]}
    require(len(actual) == len(merge["resourceRevisions"]), "MergeResult : ressource dupliquée")
    require(actual == final, "MergeResult ↔ révisions finales divergents")
    for identifier, revision in final.items():
        require(revision == initial.get(identifier, 0) + 1,
                f"{identifier}: état final incompatible avec la révision de base")


def validate_documents(root, requirements):
    scenarios = load_json(root / "docs/spec/contract-scenarios.json")["scenarios"]
    ids = [item["id"] for item in scenarios]
    require(len(ids) == len(set(ids)), "Scénarios CT dupliqués")
    require(ids == [f"CT-{number:02}" for number in range(1, len(ids) + 1)] and len(ids) >= 30,
            "Scénarios CT : ordre discontinu ou scénarios obligatoires absents")
    markdown = (root / "docs/CONTRACT-TESTS.md").read_text()
    same_keys(ids, re.findall(r"^### (CT-\d+) —", markdown, re.M), "Scénarios JSON ↔ Markdown")
    labels = {"preconditions": "Préconditions", "actor": "Acteur", "request": "Requête / stimulus",
              "expectedResult": "Résultat attendu", "expectedSideEffects": "Effets de bord attendus",
              "forbiddenSideEffects": "Effets de bord interdits"}
    for scenario in scenarios:
        block = markdown.split(f"### {scenario['id']} — ", 1)[1].split("### CT-", 1)[0]
        require(block.startswith(scenario["title"] + "\n"), f"{scenario['id']}: titre divergent")
        for field, label in labels.items():
            require(scenario.get(field) and f"**{label} :** {scenario[field]}" in block,
                    f"{scenario['id']}: {field} JSON/Markdown divergent")
        expected = f"**Exigence PRD / acceptation :** {scenario['prd']} ; {scenario['acceptance']}."
        require(expected in block, f"{scenario['id']}: références/AC JSON et Markdown divergents")
        # Résout aussi SEC-01/02 et SEARCH-01..04, pas seulement leur premier ID.
        known = set(requirements) | set(re.findall(r"(?:AC|DEC|Q)-\d{2}",
                    (root / "docs/PRD.md").read_text() +
                    (root / "docs/IMPLEMENTATION-PLAN.md").read_text()))
        for field in ["prd", "acceptance"]:
            for prefix, start, suffix in re.findall(
                    r"([A-Z]+(?:-[A-Z]+)?)-(\d{2})((?:(?:\.\.|/)\d{2})*)", scenario[field]):
                numbers = [int(start)]
                for separator, stop in re.findall(r"(\.\.|/)(\d{2})", suffix):
                    if separator == "..":
                        require(int(stop) >= numbers[-1], f"{scenario['id']}: intervalle inversé")
                        numbers.extend(range(numbers[-1] + 1, int(stop) + 1))
                    else:
                        numbers.append(int(stop))
                for number in numbers:
                    identifier = f"{prefix}-{number:02}"
                    require(identifier in known, f"{scenario['id']}: référence inconnue {identifier}")
    sources = {"PRD.md", "deep-research-analyse-fonction.md", "deep-research-modele-fonctionnel.md"}
    for path in sorted((root / "docs").rglob("*.md")):
        text = path.read_text()
        if path.name not in sources:
            require("Critères d'acceptation du document" in text, f"{path}: critères documentaires absents")
        text = re.sub(r"```.*?```", "", text, flags=re.S)
        for target in re.findall(r"\]\(([^)]+)\)", text):
            if re.match(r"[a-z]+://", target) or target.startswith("#"):
                continue
            target = target.split("#")[0]
            require((path.parent / target).exists(), f"{path}: lien local absent {target}")


def validate_all(root):
    for path in sorted((root / "docs").rglob("*.json")):
        document = load_json(path)
        if path.name.endswith(".schema.json"):
            check_references(document, str(path))
            Draft202012Validator.check_schema(document)
    print("OK — JSON stricts, schémas Draft 2020-12 et références locales")
    requirements = validate_requirements(root)
    print(f"OK — {len(requirements)} exigences : contenu PRD, priorités, versions, backlog et lots")
    _, tools = validate_contracts(root)
    print(f"OK — OpenAPI, {len(tools)} outils MCP, parité HTTP/MCP et fixtures")
    validate_documents(root, requirements)
    print("OK — scénarios JSON/Markdown, références PRD et liens documentaires")
    print("SUCCÈS — validation documentaire uniquement ; aucun test applicatif exécuté")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        validate_all(args.root.resolve())
    except (InvalidSpecification, SchemaError, ValueError, KeyError, TypeError, OSError) as exc:
        print(f"ÉCHEC — {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
