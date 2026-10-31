#!/usr/bin/env python3
"""Valide des réponses HTTP effectivement observées, reçues par stdin sans journaliser leur contenu."""
import json
import sys
from pathlib import Path
from validate_specifications import load_yaml, schema_validate, dereference, InvalidSpecification


def main():
    root = Path(__file__).resolve().parents[1]
    oas = load_yaml(root / 'docs/spec/openapi.yaml')
    observations = json.load(sys.stdin)
    if not observations:
        raise InvalidSpecification('Aucune réponse observée')
    for item in observations:
        operation = oas['paths'][item['path']][item['method']]
        response = dereference(oas, operation['responses'][str(item['status'])])
        schema = response['content']['application/json']['schema']
        schema_validate({**schema, 'components': oas['components']}, item['body'],
                        f"{item['method']} {item['path']} {item['status']}")
        if item['path'].endswith('/export') and item['status'] == 200 and item['body']['data']['format'] == 'json':
            schema_validate({'$ref':'#/components/schemas/EditorialJsonExport','components':oas['components']},json.loads(item['body']['data']['text']),'Export éditorial JSON observé')
    print(f'{len(observations)} réponses HTTP observées conformes à OpenAPI')


if __name__ == '__main__':
    try:
        main()
    except (InvalidSpecification, KeyError, ValueError) as exc:
        # Ne pas imprimer de valeur d'instance (tokens / contenu privé).
        print('Échec de conformité HTTP : ' + type(exc).__name__, file=sys.stderr)
        sys.exit(1)
