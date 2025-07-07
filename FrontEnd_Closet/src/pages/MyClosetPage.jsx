import {useState, useEffect} from 'react';

function MyClosetPage() {
    const [clothList, setClothList] = useState([]); 
    useEffect(() => {
        const fetchClothes = async () => {
            try{
                const res = await fetch("http://localhost:3000/api/cloth", {
                    method: "GET",
                    credentials: "include" // ✅ 쿠키 포함해서 요청
                });
                if(!res.ok) {
                    throw new Error();
                }
                const data = await res.json();
                setClothList(data);

            } catch(err) {
                console.log(err);
            }
        }
        fetchClothes();
    }, []);

    

    return <div>
        <h1>MyClosetpage</h1>
        {clothList.map((cloth) => (
            <div key={cloth._id}>
                <h1>{cloth._id}</h1>
            </div>
    ))}
        
    </div>
}

export default MyClosetPage;