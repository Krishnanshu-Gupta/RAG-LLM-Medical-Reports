import styles from "./styles.module.css";
import axios from "axios";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {ProgressBarLine} from 'react-progressbar-line';

const apiurl = process.env.REACT_APP_API_BASE_URL;

function Chat(){
	const [error, setError] = useState("");
	const inputRef = useRef(null);
	const [progress, setProgress] = useState(0);
	const [description, setDescription] = useState("");
	const [medicalInfo, setMedicalInfo] = useState([]);

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/");
		window.location.reload();
	};

	const clickInput = () => {
		inputRef.current.click();
	};

	const onDescriptionChange = (e) => {
        setDescription(e.target.value);
    };

	const onFileChange = async (e) => {
		try {
			let upload = e.target.files;
			if (upload.length < 1) return;

			let fileUpload = new FormData();
			fileUpload.append("file", upload[0]);
			fileUpload.append("description", description);
			console.log("Sending file over.")

			// Append the token to the request headers
			axios.defaults.headers.common['Authorization'] = `${localStorage.getItem("token")}`;
			const response = await axios.post(`${apiurl}/files`, fileUpload);
			console.log(response.data.message);
			console.log(response.data.medicalInfo)
			setMedicalInfo(response.data.medicalInfo);

			axios.get(`${apiurl}/files/${localStorage.getItem("token")}`)
				.then(response => {
					// Handle the response data
					console.log('Files:', response.data);
				})
				.catch(error => {
					// Handle errors
					console.error('Error fetching files:', error);
				});
		}
		catch (error){
			if (error.response && error.response.status >= 400 && error.response.status <= 500) {
				setError(error.response.data.message);
			}
		}
	};

	return (
		<div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column"}}>
			<div className={styles.main_container}>
				<nav className={styles.navbar}>
					<h1>Doctorly AI</h1>
					<button className={styles.white_btn} onClick={handleLogout}>
						Logout
					</button>
				</nav>
			</div>
			<div className = {styles.page}>
				<div className={styles.dropzone} onClick={clickInput}>
					<span className="drop-zone__prompt">
						Drop file here or click to upload
					</span>
					<input
						type="file"
						name="file"
						className={styles.dropzone_input}
						ref={inputRef}
            			onChange={onFileChange}
					/>
				</div>
				<div className={styles.description_input}>
                    <input
                        type="text"
                        placeholder="Add a short description or title for your medical report"
                        value={description}
                        onChange={onDescriptionChange}
                    />
                </div>

					{/*
					<div className={styles.progress}>
					<ProgressBarLine
						value={progress}
						min={0}
						max={100}
						strokeWidth={5}
						trailWidth={5}
						styles={{
							path: {
								stroke: '#17b978'
							},
							trail: {
								stroke: '#a7ff83'
							},
							text: {
								fill: '#404040',
								textAlign: 'center',
								fontSize: '18px'
							}
						}}
					/>
				</div>
				*/}

				<div className={styles.text}>
					<h3>Extracted Information</h3>
					<textarea className={styles.text_area} readOnly={false} placeholder=" ">
						{medicalInfo && Array.isArray(medicalInfo) && medicalInfo.length > 0 && (
							<div>
								{medicalInfo.Entities.map(entity => (
									<h key={entity.Id}>{entity.Text}</h>
								))}
							</div>
						)}
					</textarea>
				</div>
			</div>
		</div>
	);
};

export default Chat;
