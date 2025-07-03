import {useState} from 'react';

function LoginPage() {
    const[email, setEmail] = useState(' ');
    const[password, setPassword] = useState(' ');
    const[message, setMessage] = useState(' ');

    const handleLogin = async() => {
        try{
            const response = await fetch('http://localhost:3000/auth/login', {
                method : 'POST',
                headers: {
                    'Content-Type' : 'application/json',
                },
                body: JSON.stringify({email , password}),
            });

            const data = await response.json();

            if(response.ok) {
                setMessage('로그인 성공!');
                console.log('Login success : ', data);
            } else {
                setMessage(`로그인 실패 : ${data.message}`);
            } 
        } catch (error) {
            console.error('Error : ', error);
            setMessage('서버 오류 발생');
        }
    };
    
    return (
    <div>
      <h2>로그인</h2>
      <input 
      type="text" 
      placeholder="이메일" 
      value={email} 
      onChange = {(e)=> setEmail(e.target.value)} 
      /><br />
      <input 
      type="password" 
      placeholder="비밀번호" 
      value={password}
      onChange = {(e) => setPassword(e.target.value)}
      /><br/>
      <button 
      onClick = {handleLogin}>
        로그인
        </button>
    </div>
  );
}

export default LoginPage;