import yaml

from backend.services.recipe_generator import generate_recipe_spec


def test_generate_recipe_spec_outputs_yaml():
    vector = [80.0, 50.0, 40.0, 20.0]
    spec_yaml = generate_recipe_spec(vector)
    data = yaml.safe_load(spec_yaml)

    assert "steps" in data
    assert len(data["steps"]) == 3
    assert data["meta"]["source_vector_checksum"] == sum(vector)
