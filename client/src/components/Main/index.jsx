import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

function Main() {
    const navigate = useNavigate();
    const handleLogout = () => {
		localStorage.removeItem("token");
		window.location.reload();
	};

    const chat = () => {
        navigate("/chat");
    };

    const reports = () => {
        navigate("/reports");
    };

    const profile = () => {
        navigate("/profile");
    };

    return (
        <div style={{}}>
            {/* Navbar */}
            <div className={styles.main_container}>
                <nav className={styles.navbar}>
                    <div className={styles.title_container}>
                        <FontAwesomeIcon icon={faHome} className={styles.home_icon} />
                        <h1>Doctorly AI</h1>
                    </div>
                    <button className={styles.white_btn} onClick={handleLogout}>
                        Logout
                    </button>
                </nav>
            </div>
            <div style={{
                padding: "10px",
                justifyContent: "center",
                width: "85%",
                margin: "0 auto" // Optional: to center the container itself
            }}>
                {/* Dashboard Header */}
                <div className={styles.dashboard_header} onClick={profile}>
                    <h2 style={{ color: "#4a90e2", marginBottom: "10px" }}>Your Health Profile</h2>
                    <div className={styles.progress_container}>
                        <span>100% Completed</span>
                        <div className={styles.progress_circle}></div>
                    </div>
                </div>

                {/* Dashboard Body */}
                <div className={styles.dashboard}>
                    <div className={`${styles.card} ${styles.chatdoctor}`} onClick={chat}>
                        <div className={styles.card_content}>
                            <div>
                                <h3>Chat with Doctorly AI</h3>
                                <p>Get instant help with your health questions</p>
                            </div>
                            <img src="/images/ai_doctor.webp" alt="Chat with AI Doctor" className={styles.card_image} />
                        </div>
                    </div>
                    <div className={`${styles.card} ${styles.labtests}`} onClick={reports}>
                        <div className={styles.card_content}>
                            <div>
                                <h3>Lab Tests & Reports</h3>
                                <p>Upload and view your lab test results</p>
                            </div>
                            <img src="/images/lab_tests.webp" alt="Lab Tests" className={styles.card_image} />
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.card_content}>
                            <div>
                                <h3>Checkup Plan</h3>
                                <p>Coming Soon</p>
                            </div>
                            <img src="/images/checkup.webp" alt="Checkup Plan" className={styles.card_image} />
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.card_content}>
                            <div>
                                <h3>Health Reports</h3>
                                <p>Coming Soon</p>
                            </div>
                            <img src="/images/reports.webp" alt="Health Reports" className={styles.card_image} />
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.card_content}>
                            <div>
                                <h3>Consult Top Doctors</h3>
                                <p>Coming Soon. Online consultation with doctors worldwide</p>
                            </div>
                            <img src="/images/online.webp" alt="Consult Top Doctors" className={styles.card_image} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Main;
