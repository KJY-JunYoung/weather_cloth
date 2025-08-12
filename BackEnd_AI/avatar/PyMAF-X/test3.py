import pickle

with open("data/smpl/SMPLX_MALE.pkl", "rb") as f:
    data = pickle.load(f, encoding="latin1")

print(type(data))
print(data.keys() if hasattr(data, "keys") else data)
