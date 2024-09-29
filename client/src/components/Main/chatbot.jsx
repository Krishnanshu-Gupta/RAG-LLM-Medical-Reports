import styles from "./styles.module.css";
import axios from "axios";
import { useRef, useState, useEffect } from "react";
//import { pdfjs, Document, Page } from 'react-pdf';
//import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
//import 'react-pdf/dist/esm/Page/TextLayer.css';
import { FiMessageSquare, FiPlus } from "react-icons/fi";
import AnimatedBotMessage from './AnimatedBotMessage';
//import PdfViewer from './PDFViewer';
import { EmbedPDF } from "@simplepdf/react-embed-pdf";
import BotResponse from './BotResponse';
import { v4 as uuidv4 } from 'uuid';
import Bar from "../Charts/Bar";
import Chart from 'chart.js/auto';
import { LineChart, AnimatedLine } from '@mui/x-charts/LineChart';
import Stack from '@mui/material/Stack';
import * as ss from 'simple-statistics';

/*
create database table to store fake patient data for certain blood reports and
make normalized area charts for multiple values together with a green and red range
either by coloring line directly or by stacked graphs.

needs to be accessible to the chatbot through a simple message like Hemoglobin
or Data, etc.
ex: Data: Hemoglobin, 2000-2023

Also, need to try and do an extrapolation for future points 1-2 date points in the
future.
*/

function Chatbot() {
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const [showReportSummary, setShowReportSummary] = useState(true);
    const inputRef = useRef(null);
    const [description, setDescription] = useState("");
    const [medicalInfo, setMedicalInfo] = useState([]);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [conversationID, setConversationID] = useState("");

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/conversations/user/${localStorage.getItem("token")}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setConversations(response.data.conversations);
            } catch (error) {
                console.error("Error fetching conversations:", error);
                setError("Error fetching conversations");
            }
        };
        fetchConversations();
    }, []);

    useEffect(() => {
        setConversationID(generateConversationID());
    }, []);

    const generateConversationID = () => {
        return uuidv4().replace(/-/g, '').substring(0, 24);
    };

    const newChat = async () => {
        setConversationID(generateConversationID());
        setMessages([]);
    }

    const chatClicks = async (conversationID) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/conversations/conversation/${localStorage.getItem("token")}/${conversationID}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const messages = response.data.map(({ sender, message }) => ({ sender, text: message }));
            setMessages(messages);
            setConversationID(conversationID);
        } catch (error) {
            console.error("Error fetching conversations:", error);
            setError("Error fetching conversations");
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    const [mainReport, setMainReports] = useState("");
    const [topReports, settopReports] = useState([]);

    const sendMessage = async () => {
        //Chart: 0, 13, 17, 25, 15, Hemoglobin
        //Line: 10, 12, 11, 10.4, 10.8, 11.3, Hemoglobin

        //Data: Hemoglobin, 2014-2024
        //Data: All, 2014-2024
        //Data: Hemoglobin
        if (input.trim() === "") return;
        if(input.startsWith("Data:")){
            const [, rest] = input.split(":");
            var userMessage = { sender: "user", text: input };
            setMessages([...messages, userMessage]);

            const response = await axios.get(`http://localhost:8080/api/bloodreport/report/${localStorage.getItem("token")}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            console.log(response.data)
            var reports = response.data;
            var data = []
            //all items
            if(rest.trim().startsWith("All") || rest.trim().startsWith("all")){
                data = reports.map(report => {
                    let extractedData = { date: report.reportDate };
                    for (let item in report) {
                        if (report[item]?.result !== undefined && report[item]?.unit !== undefined) {
                            extractedData[item] = {
                                result: report[item].result,
                                unit: report[item].unit,
                                min: report[item]?.referenceRange?.min,
                                max: report[item]?.referenceRange?.max
                            };
                        }
                    }
                    return extractedData;
                });
            }
            //years specified
            if(rest.includes(",")){
                const parts = rest.split(", ");
                const item = parts[0].trim();
                if(item != "All" && item != "all"){
                    data = reports.map(report => ({
                        date: report.reportDate,
                        [item]: {
                            result: report[item].result,
                            unit: report[item].unit,
                            min: report[item].referenceRange.min,
                            max: report[item].referenceRange.max
                        }
                    }));
                }
                //ranged year data
                if(rest.includes("-")){
                    const years = parts[1].split("-");
                    const start = years[0].trim(), end = years[1].trim();
                    const ranged = data.filter(report => {
                        const year = new Date(report.date).getFullYear();
                        return year >= start && year <= end;
                    });

                    const yearsArr = ranged.map(report => {
                        const date = new Date(report.date);
                        return date;
                    });

                    const displayReports = {};
                    ranged.forEach(report => {
                        const reportDate = new Date(report.date);
                        yearsArr.push(reportDate);

                        Object.keys(report).forEach(item => {
                            if (item === 'date') return;

                            const { min, max, result, unit } = report[item];
                            const title = item.charAt(0).toUpperCase() + item.slice(1);
                            const min_rep = parseInt(min - (max - min));
                            const max_rep = parseInt(max + (max - min));

                            if (min !== undefined && max !== undefined && result !== undefined) {
                                if (!displayReports[item]) {
                                    displayReports[item] = {
                                        min: min_rep < 0 ? 0 : min_rep,
                                        range_min: min,
                                        range_max: max,
                                        max: max_rep,
                                        title: title + " (" + unit + ")",
                                        values: []
                                    };
                                }
                                displayReports[item].values.push(result);
                            }
                        });
                    });
                    /*
                    Object.keys(displayReports).forEach(item => {
                        const values = displayReports[item].values;
                        const years = values.map((_, index) => index + 1);

                        // Create linear regression model
                        const linearRegression = ss.linearRegression(years.map((year, index) => [year, values[index]]));
                        const linearRegressionLine = ss.linearRegressionLine(linearRegression);

                        // Predict the next year's value
                        const nextYear = Math.max(...years) + 1;
                        const predictedValue = linearRegressionLine(nextYear);
                        displayReports[item].values.push(predictedValue);
                    });

                    // Add the next year's date to yearsArr
                    const maxYear = Math.max(...yearsArr.map(date => date.getFullYear()));
                    const nextDate = new Date(maxYear + 1, 0, 1); // January 1st of the next year
                    console.log
                    yearsArr.push(nextDate); */

                    console.log(displayReports)
                    const displayReportsArray = Object.values(displayReports);
                    console.log(displayReportsArray)
                    console.log(yearsArr)
                    const msg = { sender: "line", years: yearsArr, reports: displayReportsArray};
                    setMessages(prevMessages => [...prevMessages, msg]);
                    //setInput("");
                }
                //specific year data
                else {
                    const targetYear = parts[1].trim();
                    console.log(targetYear)
                    const specific = data.filter(report => {
                        const year = new Date(report.date).getFullYear();
                        console.log(year)
                        return year == targetYear;
                    });
                    console.log(specific)
                    specific.forEach(report => {
                        Object.keys(report).forEach(item => {
                            // Extract relevant data from the report
                            const { min, max, result, unit } = report[item];
                            var title = item.charAt(0).toUpperCase() + item.slice(1)
                            var min_rep = parseInt(min - (max - min));
                            min_rep = min_rep < 0 ? 0 : min_rep;
                            var max_rep = parseInt(max + (max - min));
                            if (min && max && result ){
                                const msg = {
                                    sender: "bar",
                                    min: min_rep,
                                    range_min: min,
                                    range_max: max,
                                    max: max_rep,
                                    value: result,
                                    title: title + " (" + unit + ")"
                                };
                                setMessages(prevMessages => [...prevMessages, msg]);
                            }
                        });
                    });
                    setInput("");
                }
            }
            //current year
            else {
                var targetYear = 2023;
                if(rest.trim() != "All" && rest.trim() != "all"){
                    var item = rest.trim();
                    data = reports.map(report => ({
                        date: report.reportDate,
                        [item]: {
                            result: report[item]?.result,
                            unit: report[item].unit,
                            min: report[item].referenceRange.min,
                            max: report[item].referenceRange.max
                        }
                    }));
                }
                const current = data.filter(report => {
                    const year = new Date(report.date).getFullYear();
                    return year == targetYear;
                });
                current.forEach(report => {
                    Object.keys(report).forEach(item => {
                        // Extract relevant data from the report
                        const { min, max, result, unit } = report[item];
                        var title = item.charAt(0).toUpperCase() + item.slice(1)
                        var min_rep = parseInt(min - (max - min));
                        min_rep = min_rep < 0 ? 0 : min_rep;
                        var max_rep = parseInt(max + (max - min));
                        if (min && max && result ){
                            const msg = {
                                sender: "bar",
                                min: min_rep,
                                range_min: min,
                                range_max: max,
                                max: max_rep,
                                value: result,
                                title: title + " (" + unit + ")"
                            };
                            setMessages(prevMessages => [...prevMessages, msg]);
                        }
                    });
                });
                setInput("");
            }
        }
        /*
        else if(input.startsWith("Line:")){
            const userMessage = { sender: "user", text: input };
            setMessages([...messages, userMessage]);
            const [, part] = input.split(":");
            const parts = part.split(", ");
            const title = parts.pop();
            const nums = parts.map(Number);
            const years = [
                new Date(2024, 1, 1),
                new Date(2024, 2, 1),
                new Date(2024, 3, 1)
            ];
            const values = [nums[0], nums[1], nums[2]];
            const msg = { sender: "line", years: years, values: values, title: title};
            setMessages([...messages, msg]);
            setInput("");
        } */
        else {
            const userMessage = { sender: "user", text: input };
            setMessages([...messages, userMessage]);
            setInput("");
            try {
                const response = await axios.post("http://localhost:8080/api/conversations/chat", {
                    message: input,
                    token: localStorage.getItem("token"),
                    conversationID: conversationID,
                    topic: input
                });
                console.log(response.data.botResponse)
                //const botMessage = { sender: "bot", text: response.data.botResponse };
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "bot", text: <BotResponse response={response.data.botResponse} /> }
                    //{ sender: "bot", text: response.data.botResponse }
                ]);
            } catch (error) {
                setError("Error sending message");
                console.error("Error sending message:", error);
            }
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    const clickInput = () => {
        inputRef.current.click();
    };

    const onFileChange = async (e) => {
        console.log("hello")
        try {
            let upload = e.target.files;
            if (upload.length < 1) return;

            let fileUpload = new FormData();
            fileUpload.append("file", upload[0]);
            fileUpload.append("description", description);
           // console.log("Sending file over.");

            // Append the token to the request headers
            axios.defaults.headers.common['Authorization'] = `${localStorage.getItem("token")}`;
            //const response = await axios.post("http://localhost:8080/api/files", fileUpload);
            //console.log(response.data.message);
            //console.log(response.data.medicalInfo)
            //setMedicalInfo(response.data.medicalInfo);

            /* axios.get(`http://localhost:8080/api/files/${localStorage.getItem("token")}`)
                .then(response => {
                    // Handle the response data
                    console.log('Files:', response.data);
                })
                .catch(error => {
                    // Handle errors
                    console.error('Error fetching files:', error);
                });
            */

            console.log("pre send")
            const response = await axios.post("http://localhost:8080/api/test/chat", {
                message: "testing",
                token: localStorage.getItem("token"),
            });

            axios.post(`http://localhost:8080/api/bloodreport/generate`, {
                token: localStorage.getItem("token")
            }).then(response => {
                // Handle the response data
                console.log(response.data);
            }).catch(error => {
                // Handle errors
                console.error('Error generating report data:', error);
            });
        }
        catch (error) {
            if (error.response && error.response.status >= 400 && error.response.status <= 500) {
                setError(error.response.data.message);
            }
        }
    };

    const toggleReportSummary = () => {
        setShowReportSummary(!showReportSummary);
    };

    const fileUploadBtn = () => {

    }

    return (
        <div className={styles.container}>
            <div className={styles.nav_container}>
                <nav className={styles.navbar}>
                    <button className={styles.minimize_btn} onClick={toggleReportSummary}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="icon-xl-heavy"
                        >
                            <path
                                fill="currentColor"
                                fillRule="evenodd"
                                d="M8.857 3h6.286c1.084 0 1.958 0 2.666.058.729.06 1.369.185 1.961.487a5 5 0 0 1 2.185 2.185c.302.592.428 1.233.487 1.961.058.708.058 1.582.058 2.666v3.286c0 1.084 0 1.958-.058 2.666-.06.729-.185 1.369-.487 1.961a5 5 0 0 1-2.185 2.185c-.592.302-1.232.428-1.961.487C17.1 21 16.227 21 15.143 21H8.857c-1.084 0-1.958 0-2.666-.058-.728-.06-1.369-.185-1.96-.487a5 5 0 0 1-2.186-2.185c-.302-.592-.428-1.232-.487-1.961C1.5 15.6 1.5 14.727 1.5 13.643v-3.286c0-1.084 0-1.958.058-2.666.06-.728.185-1.369.487-1.96A5 5 0 0 1 4.23 3.544c.592-.302 1.233-.428 1.961-.487C6.9 3 7.773 3 8.857 3M6.354 5.051c-.605.05-.953.142-1.216.276a3 3 0 0 0-1.311 1.311c-.134.263-.226.611-.276 1.216-.05.617-.051 1.41-.051 2.546v3.2c0 1.137 0 1.929.051 2.546.05.605.142.953.276 1.216a3 3 0 0 0 1.311 1.311c.263.134.611.226 1.216.276.617.05 1.41.051 2.546.051h.6V5h-.6c-1.137 0-1.929 0-2.546.051M11.5 5v14h3.6c1.137 0 1.929 0 2.546-.051.605-.05.953-.142 1.216-.276a3 3 0 0 0 1.311-1.311c.134-.263.226-.611.276-1.216.05-.617.051-1.41.051-2.546v-3.2c0-1.137 0-1.929-.051-2.546-.05-.605-.142-.953-.276-1.216a3 3 0 0 0-1.311-1.311c-.263-.134-.611-.226-1.216-.276C17.029 5.001 16.236 5 15.1 5zM5 8.5a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1M5 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                    </button>
                    <h1>Medical Report RAG Chatbot</h1>
                    <button className={styles.white_btn} onClick={handleLogout}>
                        Logout
                    </button>
                </nav>
            </div>
            <div className={styles.page}>
                {showReportSummary && (
                    <div className={styles.side_panel}>
                        {/* Add report summary components here */}
                        {/*<div className={styles.report_title}>Uploaded Reports</div>
                        <div className={styles.reports_summary}>
                            {/*}
                            <div>
                                <nav>
                                    <button onClick={goToPrevPage}>Prev</button>
                                    <button onClick={goToNextPage}>Next</button>
                                    <p>
                                        Page {pageNumber} of {numPages}
                                    </p>
                                </nav>

                                <Document
                                    file="./bloodreportcopy.pdf"
                                    onLoadSuccess={onDocumentLoadSuccess}
                                >
                                    <Page pageNumber={pageNumber} />
                                </Document>
                            </div>
                            }
                        </div>
                        <div className={styles.line}></div>*/}
                        <div className={styles.new_chat_button} onClick={newChat}>
                            <FiPlus />
                            <p>New Chat</p>
                        </div>
                        <div className={styles.line}></div>
                        <div className={styles.chat_title}>Previous Chats</div>
                        <div className={styles.chat_summary}>
                            {conversations.slice().reverse().map((conversation, index) => (
                                <div key={index} className={styles.summary} onClick={() => chatClicks(conversation.conversationID)}>
                                    <FiMessageSquare />
                                    <p>{conversation.topic}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className={styles.chat}>
                    <div className={styles.chat_container}>
                        <div className={styles.chat_window}>
                            {messages.map((message, index) => (
                                message.sender === 'bar' ? (
                                    <>
                                        <Bar min={message.min} range_min={message.range_min}
                                        range_max={message.range_max} max={message.max}
                                        value={message.value} title={message.title}/>
                                    </>
                                ) : message.sender === 'line' ? (
                                    <>
                                        <Stack direction="column" width="75%" spacing={1}>
                                            {message.reports.map((report, reportIndex) => (
                                                <LineChart
                                                    key = {reportIndex}
                                                    height={200}
                                                    series={[
                                                        {
                                                            data: report.values,
                                                            label: report.title
                                                        }
                                                    ]}
                                                    xAxis={[
                                                        {
                                                            scale: 'point',
                                                            data: message.years,
                                                            scaleType: 'time',
                                                            valueFormatter: (date) => new Date(date).getFullYear().toString(),
                                                        }
                                                    ]}
                                                    yAxis={[{
                                                        colorMap: {
                                                            type: 'piecewise',
                                                            thresholds: [report.range_min, report.range_max],
                                                            colors: ['red', 'green', 'red'],
                                                        }
                                                    }]}
                                                    margin={{ bottom: reportIndex === message.reports.length - 1 ? 20 : -5, top: 5 }}
                                                />
                                            ))}
                                        </Stack>
                                    </>
                                ) : (
                                    <div key={index} className={styles[`${message.sender}_message`]}>
                                        {message.sender === 'bot' ? (
                                            <BotResponse response={message.text} />
                                        ) : (
                                            message.text
                                        )}
                                    </div>
                                )
                            ))}

                        </div>
                        <div className={styles.input_container}>
                            <button className={styles.file_btn} onClick={clickInput}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M9 7a5 5 0 0 1 10 0v8a7 7 0 1 1-14 0V9a1 1 0 0 1 2 0v6a5 5 0 0 0 10 0V7a3 3 0 1 0-6 0v8a1 1 0 1 0 2 0V9a1 1 0 1 1 2 0v6a3 3 0 1 1-6 0z" clip-rule="evenodd"></path></svg>
                                <input
                                    type="file"
                                    name="file"
                                    className={styles.dropzone_input}
                                    ref={inputRef}
                                    onChange={onFileChange}
                                />
                            </button>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Type a message here..."
                                value={input}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                            />
                            <button className={styles.send_btn} onClick={sendMessage}>
                                Send
                            </button>
                        </div>
                        {error && <div className={styles.error}>{error}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;