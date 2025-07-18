import './myPage.css';
import { useState, useEffect } from "react";
import UnityViewer from '../components/UnityViewer'
import MyMenu from '../components/MyMenu'

function MyPage() {
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    height: 0,
    weight: 0,
    gender: null
  });

  const [userInfo, setUserInfo] = useState(null);  // 🔥 user 상태 추가
  const [clothInfo, setClothInfo] = useState(null);
  const [modify, setModify] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchMyInfo();
      setFormData({
        email: data.user.email,
        name: data.user.name,
        height: data.user.height,
        weight: data.user.weight,
        gender: data.user.gender,
      });
      setUserInfo(data.user); // 🔥 상태로 저장

      const clothData = await fetchClothInfo();
      setClothInfo(clothData);

    };

    loadData();
  }, []);

//   const fetchMyCloth

  const fetchMyInfo = async () => {
    const res = await fetch(`http://localhost:3000/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await res.json();
    return data;
  };

const modifyMyInfo = async () => {
  const res = await fetch(`http://localhost:3000/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  });

  const data = await res.json();

  // 📌 userInfo 업데이트
  if (res.ok) {
    setUserInfo(data.user);  // 서버가 수정된 user 반환한다면
    setModify(false);
  } else {
    alert("수정 실패: " + data.message || "알 수 없는 에러");
  }
};

  const fetchClothInfo = async () => {
    const res = await fetch(`http://localhost:3000/api/cloth`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })

    const data = await res.json();
    return data;
  }  

  //   const data = await res.json();
  //   setUserInfo(data.user);     // ← 서버 응답이 있다면 이걸로 최신 상태 반영
  //   setModify(false);     
  // };

  return (
        <div className="MyPage">
        <div className="info">
            <div className="mannequin">
            <span>MY MANNEQUIN</span>
            <div className="mannequin3D">
              <UnityViewer></UnityViewer>
            </div>
            </div>
            <div className="infoWindow">
                <div className="infoWindowDesc">
                  <div className="shibal">
                <span className="titleOfInformation">MY INFO</span>
                
            {userInfo && (
    <div className="information">
        {/* EMAIL은 수정 안 하니까 그대로 보여주기 */}
        <div>
        <span>E-MAIL</span>
        <span>
            {modify ? (
                <input
                type="text"
                value={formData.email}
                onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                }
                />
            ) : (
                <span>{userInfo.email}</span>
            )}
        </span>
        </div>


        {/* NAME */}
        <div>
        <span>NAME</span>
        <span>
            {modify ? (
                <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                }
                />
            ) : (
                <span>{userInfo.name}</span>
            )}
        </span>
        </div>

        {/* HEIGHT */}
        <div>
        <span>HEIGHT</span>
        <span>
            {modify ? (
            <input
            type="number"
            value={formData.height}
            onChange={(e) =>
                setFormData({ ...formData, height: Number(e.target.value) })
            }
            />
        ) : (
            <span>{userInfo.height}</span>
        )}
        </span>
        </div>

        {/* WEIGHT */}
        <div>
        <span>WEIGHT</span>
        <span>
            {modify ? (
            <input
            type="number"
            value={formData.weight}
            onChange={(e) =>
                setFormData({ ...formData, weight: Number(e.target.value) })
            }
            />
        ) : (
            <span>{userInfo.weight}</span>
        )}
        </span>
        </div>

        {/* GENDER */}
        <div>
        <span>GENDER</span>
        <span>
            {modify ? (
            <select
            value={formData.gender}
            onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
            }
            >
            <option value="남">MALE</option>
            <option value="여">FEMALE</option>
            </select>
        ) : (
            <span>{userInfo.gender === "남" ? "MALE" : "FEMALE"}</span>
        )}
        </span>
        </div>

        {/* 버튼 영역 */}
        <div className="ButtonMyInfo">
        {modify ? (
            <>
            <button onClick={modifyMyInfo}>SAVE</button>
            <button onClick={() => setModify(false)}>CANCEL</button>
            </>
        ) : (
            <button onClick={() => setModify(true)}>MODIFY</button>
        )}
        </div>
    </div>
    )}
                
            </div>
            <div className="ClosetPanel">
              <span className="titleOfInformation">MY CLOSET</span>
              <div className="tlqkf2">
              
              <div className="allInfo">
              <div className="topInfo">
                <div><span>T-Shirt</span><span>12</span></div>
                <div><span>Shirt</span><span>34</span></div>
                <div><span>SweatShirt</span><span>56</span></div>
                <div><span>Hoodie</span><span>78</span></div>
                <div className='calcTop'><span>TOP</span><span>123</span></div>
              </div>
              <div className="bottomInfo">
                <div><span>Pants</span><span>12</span></div>
                <div><span>Shorts</span><span>34</span></div>
                <div><span>Skirt</span><span>56</span></div>
                <div><span></span><span></span></div>
                <div className='calcBottom'><span>BOTTOM</span><span>123</span></div>
              </div>
              
              </div>
              <div className="emptyInfo">

              </div>
              </div>
            </div>
            </div>
            <div className="border"></div>
            <MyMenu></MyMenu>
            </div>
            
        </div>
        </div>
    );
}

export default MyPage;
