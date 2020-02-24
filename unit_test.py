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


def test_put_ride1():
    url = "http://localhost/api/v1/rides"
    data = {"created_by": "VRG", "timestamp": "12-12-1998:23-23-12",
            "source": "9", "destination": "123"}
    out = requests.post(url, data=data).status_code
    assert out == 201


def test_put_ride2():
    url = "http://localhost/api/v1/rides"
    data = {"created_by": "AEK", "timestamp": "12-12-1998:23-23-12",
            "source": "9", "destination": "123"}
    out = requests.post(url, data=data).status_code
    assert out == 404


def test_list_ride1():
    url = "http://localhost/api/v1/rides?source=9&destination=123"
    out = requests.post(url).status_code
    assert out == 200


def test_list_ride2():
    url = "http://localhost/api/v1/rides?source=9&destination=123"
    out = requests.post(url).status_code
    assert out == 404


def test_list_ride3():
    url = "http://localhost/api/v1/rides?source=&destination=123"
    out = requests.post(url).status_code
    assert out == 204


def test_list_ride4():
    url = "http://localhost/api/v1/rides?source=9&destination= "
    out = requests.post(url).status_code
    assert out == 204


def test_list_ride5():
    url = "http://localhost/api/v1/rides?sauce=420"
    out = requests.post(url).status_code
    assert out == 204


def test_list_ride6():
    url = "http://localhost/api/v1/rides?source=500&destination=150"
    out = requests.post(url).status_code
    assert out == 400


def test_list_ride7():
    url = "http://localhost/api/v1/rides?source=3&destination=114"
    out = requests.post(url).status_code
    assert out == 200


def test_list_ride8():
    url = "http://localhost/api/v1/rides?source=91&destination=500"
    out = requests.post(url).status_code
    assert out == 400
