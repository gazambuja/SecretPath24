import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { SnackbarProvider, enqueueSnackbar } from "notistack";
import { ThreeDots } from "react-loader-spinner";
import TypewriterEffect from "./components/TypewriterEffect";
import { Cursor } from "react-simple-typewriter";
import { AnimatedCounter } from "react-animated-counter";
import { AES, enc, MD5 } from "crypto-js";
import LoginDialogue from "./components/LoginDialogue";
import CustomAudioPlayer from "./components/CustomAudioPlayer";
import { useParams } from 'react-router-dom'; // Import useParams

const baseURL =
  "https://scarlett-endpoint-hscrfzene3bgawcb.eastus-01.azurewebsites.net/secretpath?route=";

function App() {
  let cookies = decodeURIComponent(document.cookie).split("|");
  const [loginValue, setLoginValue] = useState(cookies[0] || "");
  const [answerValue, setAnswerValue] = useState("");
  const [lifePoints, setLifePoints] = useState(0);

  const [tooMuchQuestion, setTooMuchQuestion] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const [showNextQuestion, setShowNextQuestion] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [modalOpen, setModalOpen] = useState("login");
  const [loadingSpinner, setLoadingSpinner] = useState(false);
  const [textContent, setTextContent] = useState([]);

  const [autoPlay, setAutoPlay] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showCursorState, setShowCursorState] = useState(false);
  const modalRef = useRef();
  const loginModalRef = useRef();
  const scrollInto = useRef();

  const [audioCurrentTime, setAudioCurrentTime] = useState("0:00");

  const validEmail = new RegExp(
    "^[a-zA-Z0-9._:$!%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]$"
  );

  // const [searchParams, setSearchParams] = useSearchParams(); // Get search parameters
  // const lang = searchParams.get('lang') || 'en'; // Get language from URL, default to 'en'
  const { lang } = useParams(); // Get language from URL parameter

  function handleContinueClick() {
    modalRef.current?.showModal();
  }

  React.useEffect(() => {
    //ingresamos con direccion de correo
    //hash con agente y direccion de correo del usuairo
    //verificar que es perficient.com y hacer undescore

    //string fijo que corresponde a la persona
    //envio el string a backend, con direccion de correo y hash, y una variable
    //
    /*  {
      "index": 2, //ping pong, cuando mande la respuesta te devielvo esto,
      "content":"bla bla bla parrafo de la historia",
      "final_question": "insert your answer:" Titulo del modal, parrafo
  } */

    if (modalOpen == "login") {
      setLifePoints(0);
    }

    loginModalRef.current?.showModal();
    setModalOpen("login");
  }, []);

  const scrollIntoView = () => {
    scrollInto.current.scrollIntoView({ behavior: "smooth" });
  };

  function handleMyError(message, lifePoints) {
    setLoadingSpinner(false);
    enqueueSnackbar(message, {
      variant: "error",
    });

    if (lifePoints == -1) {
    } else {
      setLifePoints(lifePoints);
    }
  }
  // POST LOGIN
  function handleSendLogin() {
    const userAgent = navigator.userAgent.toLowerCase();
    const userPerficientMail = loginValue.toLowerCase();

    const cipherText = MD5(userPerficientMail.trim() + userAgent.trim(), "OZ");
    let cookies = decodeURIComponent(document.cookie).split("|");
    if (cookies.length != 2) {
      document.cookie = userPerficientMail.trim() + "|1.0";
    }

    let loginObjectToSendPost = {
      index: 0,
      hash: cipherText.toString() /* userPerficientMail.trim() + userAgent.trim() */,
      perficientEmail: userPerficientMail.trim(),
      lang: lang
    };

    //regex email
    if (!validEmail.test(userPerficientMail)) {
      enqueueSnackbar("Please enter a valid email", {
        variant: "error",
      });
    } else if (!userPerficientMail.includes("@perficient.com")) {
      enqueueSnackbar("Please enter a valid perficient email", {
        variant: "error",
      });
    } else {
      const fetchingLoginData = () => {
        setLoadingSpinner(true);
        axios
          .post(baseURL + "login", loginObjectToSendPost, { timeout: 15000 })

          .then((response) => {
            let currentQuestion = response.data.currentQuestion;

            if (!currentQuestion || currentQuestion.toLowerCase().includes("deja tu feedback")) {
              setShowNextQuestion(false);
              setShowCursorState(false);
            } else {
              setShowNextQuestion(true);
              setShowCursorState(true);
            }
            setCurrentAudio(response.data.audio);
            setModalOpen("main");
            setLifePoints(response.data.score);
            setCurrentIndex(response.data.id);
            response.data.story.forEach((element) => {
              setTextContent((prevText) => [...prevText, element]);
            });
            setCurrentQuestion(response.data.currentQuestion);
            setLoadingSpinner(false);
            setLoaded(true);

            loginModalRef.current?.close();

            setTimeout(() => {
              scrollIntoView();
            }, "400");
          })
          .catch((error) => {
            if (error.code === "ECONNABORTED") {
              handleMyError("Request timed out", -1);
            } else if (error.response.status == 500) {
              handleMyError("Request failed, please try again in a while", -1);
            } else {
              handleMyError(error.message, -1);
            }
          });
      };

      fetchingLoginData();
    }
  }

  //POST ANSWER
  function handleSendAnswer() {
    const userAgent = navigator.userAgent.toLowerCase();
    const userPerficientMail = loginValue.toLowerCase();

    const cipherText = MD5(userPerficientMail.trim() + userAgent.trim(), "OZ");
    let answerObjectToPost = {
      id: currentIndex,
      perficientEmail: userPerficientMail,
      hash: cipherText.toString(),
      answer: answerValue.toUpperCase().trim(),
      lang: lang
    };

    setModalOpen("answer");
    const fetchAnswerData = async () => {
      setLoadingSpinner(true);
      axios
        .post(baseURL + "answer", answerObjectToPost, { timeout: 15000 })
        .then((response) => {
          if (response.status == 200) {
            /* setLoadingSpinner(false); */
            //si devuelve 400 sigue el modal, salga un texto rojo que diga que esta mal
            modalRef.current?.close();
            setCurrentAudio(response.data.newAudio);
            setTextContent((oldArray) => [...oldArray, response.data.newText]);
            setCurrentQuestion(response.data.newQuestion);

            if (!response.data.newQuestion) {
              setShowNextQuestion(false);
            }
            setAnswerValue("");
            setLoadingSpinner(false);
            setCurrentIndex(response.data.newIndex);
            setTimeout(() => {
              scrollIntoView();
            }, "400");
          } else if (response.status == 206) {
            response.data.newQuestion.length > 150
              ? setTooMuchQuestion(true)
              : setTooMuchQuestion(false);
            setCurrentQuestion(response.data.newQuestion);
            setAnswerValue("");
            setLoadingSpinner(false);
          } else {
            setLoadingSpinner(false);
            enqueueSnackbar("Thats not the right answer", {
              variant: "error",
            });

            setLifePoints(error.response.data.score);
          }
        })
        .catch((error) => {
          if (error.response.status) {
            if (error.response.status == 417) {
              handleMyError(
                "Thats not the right answer",
                error.response.data.score
              );
            } else {
              handleMyError(error, -1);
            }
          } else {
            handleMyError(error, -1);
          }
        });
    };

    fetchAnswerData();
  }
  return (
    <>
      <div className="flex justify-center flex-col align-middle ">
        <div className="bg-slate-500 text-slate-300 fixed z-20  rounded-3xl lg:px-8  lg:my-5 lg:m-2 lg:p-5  bottom-0 px-14 py-4  right-0 mr-3 mb-3">
          <div className="text-center text-white ">
            Attempts:
            <AnimatedCounter
              containerStyles={{
                flex: true,
                marginBottom: "8px",
              }}
              value={lifePoints.toFixed(0)}
              color="white"
              fontSize="40px"
              decimalPrecision={0}
              incrementColor="red"
            />
            <CustomAudioPlayer
              src={currentAudio}
              isVisible={true}
              startAutoPlay={false}
              setAudioCurrentTime={setAudioCurrentTime}
              audioCurrentTime={audioCurrentTime}
            />
          </div>
        </div>
      </div>
      {modalOpen == "main" && (
        <SnackbarProvider
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
        />
      )}
      <dialog
        id="answerModal"
        ref={modalRef}
        className="p-24 border bg-[#121212] rounded-2xl max-w-xl backdrop:bg-black/10 backdrop:backdrop-blur-[2px]"
      >
        {modalOpen == "answer" && (
          <SnackbarProvider
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          />
        )}
        <h1
          className={`text-[#b3b3b3] text-center justify-center flex-wrap
            ${tooMuchQuestion ? " text-sm " : " text-2xl "}`}
          dangerouslySetInnerHTML={{ __html: currentQuestion }}
        ></h1>

        <div className="grid ">
          <input
            autoFocus
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                handleSendAnswer();
              }
            }}
            placeholder="Enter your answer"
            className="flex m-auto mt-4 rounded-md p-1.5 w-64  "
            type="text"
            maxLength={60}
            style={{ textTransform: "uppercase", fontSize: "0.8em" }}
            value={answerValue}
            onChange={(e) => {
              setAnswerValue(e.target.value);
            }}
          />
          {loadingSpinner && (
            <div className="m-auto pb-4">
              <ThreeDots
                visible={true}
                height="40"
                width="40"
                color="#4fa94d"
                radius="9"
                ariaLabel="three-dots-loading"
                wrapperStyle={{}}
                wrapperClass=""
              />
            </div>
          )}
        </div>
        <br />
        <div className=" flex  justify-between 	">
          <a
            id="closeModal"
            onClick={() => {
              modalRef.current?.close();
              setModalOpen("main");
            }}
            className="cursor-pointer grow-0 flex items-center p-3 "
          >
            Close
          </a>
          <button
            id="sendAnswer"
            type="submit"
            onClick={() => handleSendAnswer()}
            className="bg-[#b3b3b3] p-3 m-4 rounded hover:bg-[#535353] grow-0"
          >
            Send Answer
          </button>
        </div>
      </dialog>

      {/* Login modal */}
      <LoginDialogue
        handleSendLogin={handleSendLogin}
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        ref={loginModalRef}
        loginValue={loginValue}
        setLoginValue={setLoginValue}
        loadingSpinner={loadingSpinner}
      />
      <div className="flex items-center justify-center flex-col">
        {loaded &&
          textContent.map((element, index) => {
            if (textContent.length > index + 1) {
              return (
                <div
                  id="page"
                  key={index}
                  className="mb-10 top-0 lg:left-1/2 bg-[#121212] lg:w-[800px] lg:min-w-[800px] max-w-[800px]  min-h-screen border-[#64748b] border text-center pt-8 pr-16 pb-24 pl-16 mr-32 ml-32 min-w-[500px] lg:ml-32"
                >
                  <div
                    key={element}
                    dangerouslySetInnerHTML={{ __html: element }}
                    className="text-left"
                  ></div>
                </div>
              );
            } else {
              return (
                <>
                  <div key={index} id="toScrollTo" ref={scrollInto}></div>
                  <div
                    key={element}
                    id="page"
                    className="mb-10 top-0 lg:left-1/2 bg-[#121212] lg:w-[800px] lg:min-w-[800px] max-w-[800px]  min-h-screen border-[#64748b] border text-center pt-8 pr-16 pb-24 pl-16 mr-32 ml-32 min-w-[500px] lg:ml-32"
                  >
                    <TypewriterEffect
                      handleContinueClick={handleContinueClick}
                      words={element}
                      isFast={true}
                      key={element}
                      setIsTyping={setIsTyping}
                      isTyping={isTyping}
                    />

                    {showCursorState && (
                      <p className="text-left">
                        <Cursor />
                      </p>
                    )}

                    {showCursorState && showNextQuestion && (
                      <>
                        <a
                          id="continueButton"
                          className="cursor-pointer"
                          onClick={handleContinueClick}
                        >
                          Click here to continue
                        </a>
                      </>
                    )}
                  </div>
                </>
              );
            }
          })}

        <div className="min-h-64">
          <br />
        </div>
      </div>
    </>
  );
}

export default App;
