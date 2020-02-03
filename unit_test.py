import requests


url = "http://localhost:62020/api/v1/users"
data = {"username":"Hvish26", "password":"abcdef1234abcdef1234abcdef1234abcdef1234"}
def test_put_user1():
    data = {"username":"Hvish27", "password":"abcdef1234abcdef1234abcdef1234abcdef1234"}
    out = requests.put(url, data=data).status_code
    
    assert out == 201
def test_put_user2():
    data = {"username":"Hvish27", "password":"abcdef1234abcdef1234abcdef1234abcdef1234"}
    out = requests.put(url, data=data).status_code
    
    assert out == 409
def test_put_user3():
    data = {"username":"Hvish27", "password":""}
    out = requests.put(url, data=data).status_code
    assert out == 409
def test_put_user4():
    data = {"username":"Hvish29", "password":""}
    out = requests.put(url, data=data).status_code
    assert out == 400
      
def test_delete_user1():
    url = "http://localhost:62020/api/v1/users/Hvish30"
    out = requests.delete(url).status_code
    assert out == 404
def test_delete_user2():
    url = "http://localhost:62020/api/v1/users/Hvish27"
    out = requests.delete(url).status_code
    assert out == 200




    
