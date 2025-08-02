import requests

res = requests.post("http://10.104.228.88:5001/profile")
print(res.json()) 