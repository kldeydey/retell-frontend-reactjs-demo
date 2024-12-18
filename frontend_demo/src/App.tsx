import React, { useEffect, useState, useCallback } from 'react';
import "./App.css";
import { RetellWebClient } from "retell-client-js-sdk";
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

const agentId = "agent_bd5498a76717ceb507ca2591e4";

interface RegisterCallResponse {
  access_token: string;
}

const retellWebClient = new RetellWebClient();

const App = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [labelText, setLabelText] = useState("Essayer");
  const [isHovering, setIsHovering] = useState(false); // État pour gérer le survol

  const handleError = useCallback((error: any) => {
    console.error("An error occurred:", error);
    setLabelText('Veuillez réessayer plus tard');
    setIsCalling(false);
  }, []);

  useEffect(() => {
    retellWebClient.on("call_started", () => {
      console.log("call started");
      setLabelText("Parlez..");
    });

    retellWebClient.on("call_ended", () => {
      console.log("call ended");
      setIsCalling(false);
      setLabelText("Essayer");
    });

    retellWebClient.on("error", handleError);

    return () => {
      retellWebClient.off("error", handleError);
    };
  }, [handleError]);

  const toggleConversation = async () => {
    if (isCalling) {
      retellWebClient.stopCall(); // Arrête l'appel
      setIsCalling(false); // Met à jour l'état
      setLabelText("Essayer"); // Réinitialise le label
    } else {
      try {
        setLabelText("Connexion en cours...");
        const registerCallResponse = await registerCall(agentId);
        if (registerCallResponse.access_token) {
          await retellWebClient.startCall({
            accessToken: registerCallResponse.access_token,
          });
          setIsCalling(true);
          setLabelText("Parlez..");
        }
      } catch (error) {
        handleError(error);
      }
    }
  };

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    try {
      const response = await fetch("https://api.retellai.com/v2/create-web-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer key_6149571e8dadbf893f4cf7e08cec"
        },
        body: JSON.stringify({ agent_id: agentId }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      return await response.json();
    } catch (err) {
      console.error("Error in registerCall:", err);
      throw err;
    }
  }

  const handleButtonClick = async () => {
    if (isCalling) {
      toggleConversation(); // Raccroche si déjà en appel
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      toggleConversation(); // Démarre la conversation
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      setLabelText("Autorisez l'accès au microphone");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="mic-container">
          <button 
            onClick={handleButtonClick}
            onMouseEnter={() => isCalling && setIsHovering(true)}
            onMouseLeave={() => isCalling && setIsHovering(false)}
            className={`mic-button ${isCalling ? 'active' : ''}`}
          >
            {isCalling && isHovering ? <FaMicrophoneSlash /> : <FaMicrophone />} {/* Icône selon l'état */}
          </button>
          <div className="label">{labelText}</div>
        </div>
      </header>
    </div>
  );
}

export default App;