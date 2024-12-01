import Head from 'next/head';
import '../styles/login.css';

export default function Login() {
  return (
    <>
      <Head>
        <title>Hotel Login</title>
      </Head>
      <div className="background">
        <div className="overlay">
          <div className="login-box">
            <img
              src="/img/โลโก้สีส้ม.png"
              alt="Phayao Place Logo"
              className="logo"
            />
            <form>
              <input
                type="text"
                placeholder="Username"
                className="input-field"
              />
              <input
                type="password"
                placeholder="Password"
                className="input-field"
              />
              <button type="submit" className="login-button">
                Login
              </button>
            </form>
            <div className="footer-links">
              <a href="#">forgot password?</a> or <a href="#">create account</a>
            </div>
          </div>
          <div className="language-switch">
            <img src="/img/flag-400.png" alt="Thai Flag" /> ภาษาไทย
          </div>
        </div>
      </div>
    </>
  );
}
