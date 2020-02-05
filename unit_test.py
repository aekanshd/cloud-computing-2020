import requests


url = "http://localhost/api/v1/users"
data = {"username": "Hvish26",
        "password": "abcdef1234abcdef1234abcdef1234abcdef1234"}


def test_put_user1():
    data = {"username": "Hvish27",
            "password": "abcdef1234abcdef1234abcdef1234abcdef1234"}
    out = requests.put(url, data=data).status_code

    assert out == 201


def test_put_user2():
    data = {"username": "Hvish27",
            "password": "abcdef1234abcdef1234abcdef1234abcdef1234"}
    out = requests.put(url, data=data).status_code

    assert out == 409


def test_put_user3():
    data = {"username": "Hvish27", "password": ""}
    out = requests.put(url, data=data).status_code
    assert out == 409


def test_put_user4():
    data = {"username": "Hvish29", "password": ""}
    out = requests.put(url, data=data).status_code
    assert out == 400


def test_delete_user1():
    url = "http://localhost/api/v1/users/Hvish30"
    out = requests.delete(url).status_code
    assert out == 404


def test_delete_user2():
    url = "http://localhost/api/v1/users/Hvish27"
    out = requests.delete(url).status_code
    assert out == 200


def test_put_user5():
    data = {"username": "VRG",
            "password": "abcdef1234abcdef1234abcdef1234abcdef1234"}
    out = requests.put(url, data=data).status_code

    assert out == 201


def test_put_ride():
    url = "http://localhost/api/v1/rides"
    data = {"created_by": "VRG", "timestamp": "12-12-1998:23-23-12",
            "source": "Vidyaranyapura", "destination": "Vijayanapura"}
    out = requests.post(url, data=data).status_code
    assert out == 201


def test_put_ride2():
    url = "http://localhost/api/v1/rides"
    data = {"created_by": "AEK", "timestamp": "12-12-1998:23-23-12",
            "source": "Vidyaranyapura", "destination": "Vijayanapura"}
    out = requests.post(url, data=data).status_code
    assert out == 404


def test_list_ride1():
    url = "http://localhost/api/v1/rides?source=Vidyaranyapura&destination=Vijayanapura"
    out = requests.post(url).status_code
    assert out == 200


def test_list_ride2():
    url = "http://localhost/api/v1/rides?source=Vidyaranura&destination=Vijanapura"
    out = requests.post(url).status_code
    assert out == 404
