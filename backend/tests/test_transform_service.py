from backend.services.transform_service import calculate_target_vector


def test_copy_returns_target():
    source = [1.0, 2.0, 3.0]
    target = [10.0, 20.0, 30.0]
    result = calculate_target_vector(source, target, mode='COPY')
    assert result == target


def test_distance_interpolates():
    source = [0.0, 0.0]
    target = [10.0, 20.0]
    result = calculate_target_vector(source, target, mode='DISTANCE', alpha=0.5)
    assert result == [5.0, 10.0]


def test_redirect_signature_mutates_vector():
    source = [10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0]
    target = [0.0] * 9
    result = calculate_target_vector(source, target, mode='REDIRECT', direction='signature')
    assert result[0] == 18.0
    assert result[4] == 22.0
    assert result[8] == 20.0
