"""Tests de non-régression du validateur ; aucune logique applicative.

Chaque mutation conserve autant que possible les décomptes : le validateur doit
détecter le contenu incohérent, pas simplement un nombre de fichiers ou d'IDs.
"""

import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("validation", ROOT / "scripts/validate_specifications.py")
validation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validation)


class ValidatorTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        shutil.copytree(ROOT / "docs", self.root / "docs")
        shutil.copytree(ROOT / "scripts", self.root / "scripts",
                        ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copy2(ROOT / "AGENTS.md", self.root / "AGENTS.md")
        shutil.copy2(ROOT / "README.md", self.root / "README.md")
        shutil.copytree(ROOT / ".github", self.root / ".github")
        shutil.copytree(ROOT / "spikes", self.root / "spikes",
                        ignore=shutil.ignore_patterns("node_modules", "dist", "results", "test-results", "playwright-report"))

    def mutate_json(self, relative, mutate):
        path = self.root / relative
        document = json.loads(path.read_text())
        mutate(document)
        path.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n")

    def test_current_dossier(self):
        with contextlib.redirect_stdout(io.StringIO()):
            validation.validate_all(self.root)

    def test_lot1_cannot_remove_parent_cas(self):
        oas = validation.load_yaml(self.root / 'docs/spec/openapi.yaml')
        oas['components']['schemas']['EditorialMove']['required'].remove('expectedTargetStructureRevision')
        with self.assertRaises(validation.InvalidSpecification):
            validation.validate_lot1(oas)

    def test_lot1_cannot_expose_ai_write(self):
        oas = validation.load_yaml(self.root / 'docs/spec/openapi.yaml')
        oas['paths']['/projects/{projectId}/scenes/{sceneId}/content']['put']['security'] = [{'bearerAuth': []}]
        with self.assertRaises(validation.InvalidSpecification):
            validation.validate_lot1(oas)

    def test_lot1_cannot_remove_csrf(self):
        oas = validation.load_yaml(self.root / 'docs/spec/openapi.yaml')
        params = oas['paths']['/projects/{projectId}/scenes/{sceneId}/restore']['post']['parameters']
        next(p for p in params if p.get('name') == 'X-CSRF-Token')['required'] = False
        with self.assertRaises(validation.InvalidSpecification):
            validation.validate_lot1(oas)

    def test_lot0_cannot_accept_bearer_instead_of_session(self):
        oas = validation.load_yaml(self.root / "docs/spec/openapi.yaml")
        oas["paths"]["/projects"]["post"]["security"] = [{"bearerAuth": []}]
        with self.assertRaisesRegex(validation.InvalidSpecification, "sécurité de session"):
            validation.validate_lot0(oas)

    def test_lot0_cannot_make_cas_optional(self):
        oas = validation.load_yaml(self.root / "docs/spec/openapi.yaml")
        oas["components"]["parameters"]["ProjectIfMatch"]["required"] = False
        with self.assertRaisesRegex(validation.InvalidSpecification, "précondition forte"):
            validation.validate_lot0(oas)

    def test_lot0_cannot_accept_client_role(self):
        oas = validation.load_yaml(self.root / "docs/spec/openapi.yaml")
        oas["components"]["schemas"]["ProjectCreate"]["properties"]["role"] = {"type": "string"}
        with self.assertRaisesRegex(validation.InvalidSpecification, "rôle client interdit"):
            validation.validate_lot0(oas)

    def test_duplicate_json_key(self):
        path = self.root / "docs/spec/requirements.json"
        path.write_text('{"status":"Proposée","status":"Acceptée"}')
        with self.assertRaisesRegex(validation.InvalidSpecification, "dupliquée"):
            validation.load_json(path)

    def test_non_json_nan(self):
        path = self.root / "docs/spec/requirements.json"
        path.write_text('{"priority":NaN}')
        with self.assertRaisesRegex(validation.InvalidSpecification, "Constante"):
            validation.load_json(path)

    def test_duplicate_yaml_key(self):
        path = self.root / "docs/spec/openapi.yaml"
        path.write_text('openapi: 3.1.1\nopenapi: 3.0.0\n')
        with self.assertRaisesRegex(validation.InvalidSpecification, "dupliquée"):
            validation.load_yaml(path)

    def test_requirement_replaced_without_changing_count(self):
        self.mutate_json("docs/spec/requirements.json",
                         lambda data: data["requirements"][0].update(id="OBJ-99"))
        with self.assertRaisesRegex(validation.InvalidSpecification, "Registre ↔"):
            validation.validate_requirements(self.root)

    def test_nfr_target_cannot_be_a_priority(self):
        def change(data):
            item = next(row for row in data["requirements"] if row["id"] == "NFR-01")
            item["priority"] = item["text"]
        self.mutate_json("docs/spec/requirements.json", change)
        with self.assertRaisesRegex(validation.InvalidSpecification, "priority"):
            validation.validate_requirements(self.root)

    def test_prop10_priority_must_match_approved_prd(self):
        def change(data):
            next(row for row in data["requirements"] if row["id"] == "PROP-10")["priority"] = "SHOULD"
        self.mutate_json("docs/spec/requirements.json", change)
        with self.assertRaisesRegex(validation.InvalidSpecification, "PROP-10.priority"):
            validation.validate_requirements(self.root)

    def test_exact_requirement_text(self):
        def change(data):
            next(row for row in data["requirements"] if row["id"] == "NFR-02")["text"] += " hors charge"
        self.mutate_json("docs/spec/requirements.json", change)
        with self.assertRaisesRegex(validation.InvalidSpecification, "NFR-02.text"):
            validation.validate_requirements(self.root)

    def test_future_requirement_cannot_have_mvp_lot(self):
        def change(data):
            next(row for row in data["requirements"] if row["id"] == "DATA-12")["lot"] = 2
        self.mutate_json("docs/spec/requirements.json", change)
        with self.assertRaises(validation.InvalidSpecification):
            validation.validate_requirements(self.root)

    def test_backlog_lot_drift(self):
        path = self.root / "docs/IMPLEMENTATION-PLAN.md"
        original = path.read_text()
        path.write_text(original.replace("| NFR-01 | 1 | P1 |", "| NFR-01 | 2 | P1 |"))
        with self.assertRaisesRegex(validation.InvalidSpecification, "Backlog NFR-01"):
            validation.validate_requirements(self.root)
        # Une exigence V1 ajoutée en trop dans un lot doit être détectée aussi.
        path.write_text(original.replace(". Les exigences transversales", ", DATA-12. Les exigences transversales", 1))
        with self.assertRaisesRegex(validation.InvalidSpecification, "Lot 0 ↔"):
            validation.validate_requirements(self.root)

    def test_broken_schema_reference(self):
        path = self.root / "docs/spec/openapi.yaml"
        path.write_text(path.read_text().replace("#/components/schemas/Scene", "#/components/schemas/Absent"))
        with self.assertRaisesRegex(validation.InvalidSpecification, "introuvable"):
            validation.validate_contracts(self.root)

    def test_mcp_root_input_drift_even_with_unchanged_definitions(self):
        def change(data):
            tool = next(row for row in data["tools"] if row["name"] == "scene_read")
            tool["inputSchema"]["properties"]["sceneId"]["maxLength"] = 500
        self.mutate_json("docs/spec/mcp-tools.json", change)
        with self.assertRaisesRegex(validation.InvalidSpecification, "entrée HTTP/MCP"):
            validation.validate_contracts(self.root)

    def test_policy_permission_drift(self):
        def change(data):
            next(row for row in data["tools"] if row["name"] == "proposal_create")["permission"] = "proposal.merge"
        self.mutate_json("docs/spec/mcp-policy.json", change)
        with self.assertRaisesRegex(validation.InvalidSpecification, "permission"):
            validation.validate_contracts(self.root)

    def test_unknown_mcp_tool_even_with_same_count(self):
        for name in ["mcp-tools.json", "mcp-policy.json"]:
            self.mutate_json("docs/spec/" + name,
                             lambda data: data["tools"][0].update(name="proposal_merge"))
        with self.assertRaisesRegex(validation.InvalidSpecification, "Noms des outils"):
            validation.validate_contracts(self.root)

    def test_fixture_final_revision_drift(self):
        def change(data):
            data["stateAfterResolution"]["scenes"][0]["revision"] += 1
        self.mutate_json("docs/examples/proposals/01-maladie.json", change)
        with self.assertRaisesRegex(validation.InvalidSpecification, "révisions finales"):
            validation.validate_contracts(self.root)

    def test_fixture_old_approval_cannot_remain_effective(self):
        def change(data):
            data["revisionResponse"]["reviews"][0]["validity"] = "effective"
        self.mutate_json("docs/examples/proposals/02-meurtrier-conflit.json", change)
        with self.assertRaisesRegex(validation.InvalidSpecification, "approbation non invalidée"):
            validation.validate_contracts(self.root)

    def test_fixture_rebased_revision_must_match_current_base(self):
        def change(data):
            data["revisionRequest"]["body"]["operations"][1]["expectedRevision"] += 1
        self.mutate_json("docs/examples/proposals/02-meurtrier-conflit.json", change)
        with self.assertRaisesRegex(validation.InvalidSpecification, "expectedRevision révisée"):
            validation.validate_contracts(self.root)

    def test_negative_operation_schemas(self):
        fixture = validation.load_json(self.root / "docs/examples/proposals/01-maladie.json")
        schema = validation.load_json(self.root / "docs/spec/operations.schema.json")
        original = fixture["createRequest"]["body"]["operations"][1]
        mutations = [lambda op: op.update(kind="execute_sql"),
                     lambda op: op.pop("expectedRevision"),
                     lambda op: op.update(actorType="human")]
        for mutate in mutations:
            operation = copy.deepcopy(original)
            mutate(operation)
            with self.subTest(mutation=operation), self.assertRaises(validation.InvalidSpecification):
                validation.schema_validate(schema, operation, "Opération hostile")

    def test_cli_failure_from_another_working_directory(self):
        self.mutate_json("docs/spec/requirements.json",
                         lambda data: data["requirements"][0].update(id="OBJ-99"))
        result = subprocess.run([sys.executable, str(ROOT / "scripts/validate_specifications.py"),
                                 "--root", str(self.root)], cwd=self.root, text=True,
                                capture_output=True, check=False)
        self.assertEqual(result.returncode, 1)
        self.assertIn("ÉCHEC", result.stderr)


if __name__ == "__main__":
    unittest.main()
