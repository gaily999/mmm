document.addEventListener("DOMContentLoaded", () => {

  // ==============================
  // DATE AND TIME
  // ==============================

  const dateTime = document.getElementById("currentDateTime");

  function updateDateTime() {
    const now = new Date();

    dateTime.textContent = now.toLocaleString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }

  updateDateTime();
  setInterval(updateDateTime, 1000);


  // ==============================
  // ESP32 IP ADDRESS
  // ==============================

  const espIp = document.getElementById("espIp");
  const saveIp = document.getElementById("saveIp");
  const connStatus = document.getElementById("connStatus");

  const savedIp = localStorage.getItem("esp32Ip");

  if (savedIp) {
    espIp.value = savedIp;
    connStatus.textContent = `ESP32 address saved: ${savedIp}`;
  }

  saveIp.addEventListener("click", () => {

    const ip = espIp.value.trim();

    if (!ip) {
      connStatus.textContent = "Please enter the ESP32 IP address.";
      return;
    }

    localStorage.setItem("esp32Ip", ip);

    connStatus.textContent = `ESP32 address saved: ${ip}`;
  });


  // ==============================
  // HOUSE LIGHTS
  // ==============================

  const lightPanels = document.querySelectorAll(".panel[data-pin]");

  lightPanels.forEach(panel => {

    const pin = panel.dataset.pin;
    const stateLabel = panel.querySelector(".state-label");
    const bulb = panel.querySelector(".bulb");
    const glow = panel.querySelector(".bulb-glow");

    const onButton = panel.querySelector(".btn-on");
    const offButton = panel.querySelector(".btn-off");

    function setLightState(state) {

      if (state === "ON") {

        stateLabel.textContent = "ON";

        panel.classList.add("active");

        if (bulb) {
          bulb.classList.add("on");
        }

        if (glow) {
          glow.classList.add("on");
        }

        sendToESP32(`/led/${pin}/on`);

      } else {

        stateLabel.textContent = "OFF";

        panel.classList.remove("active");

        if (bulb) {
          bulb.classList.remove("on");
        }

        if (glow) {
          glow.classList.remove("on");
        }

        sendToESP32(`/led/${pin}/off`);
      }
    }

    onButton.addEventListener("click", () => {
      setLightState("ON");
    });

    offButton.addEventListener("click", () => {
      setLightState("OFF");
    });

  });


  // ==============================
  // SOUND / BUZZER
  // ==============================

  const soundStatus = document.getElementById("soundStatus");
  const buzzerState = document.getElementById("buzzerState");
  const summarySound = document.getElementById("summarySound");

  const soundOn = document.getElementById("soundOn");
  const soundOff = document.getElementById("soundOff");

  function setSoundState(state) {

    if (state === "ON") {

      soundStatus.textContent = "ON";
      buzzerState.textContent = "ON";
      summarySound.textContent = "ON";

      document.body.classList.add("sound-active");

      sendToESP32("/sound/on");

    } else {

      soundStatus.textContent = "OFF";
      buzzerState.textContent = "OFF";
      summarySound.textContent = "OFF";

      document.body.classList.remove("sound-active");

      sendToESP32("/sound/off");
    }
  }

  soundOn.addEventListener("click", () => {
    setSoundState("ON");
  });

  soundOff.addEventListener("click", () => {
    setSoundState("OFF");
  });


  // ==============================
  // ALARM
  // ==============================

  const alarmStatus = document.getElementById("alarmStatus");
  const alarmIndicator = document.getElementById("alarmIndicator");

  const alarmOn = document.getElementById("alarmOn");
  const alarmOff = document.getElementById("alarmOff");

  const oledAlarm = document.getElementById("oledAlarm");
  const summaryAlarm = document.getElementById("summaryAlarm");

  function setAlarmState(state) {

    if (state === "ON") {

      alarmStatus.textContent = "ON";

      alarmIndicator.textContent = "TRIGGERED";
      alarmIndicator.classList.remove("safe");
      alarmIndicator.classList.add("triggered");

      summaryAlarm.textContent = "ON";
      summaryAlarm.classList.remove("safe");
      summaryAlarm.classList.add("triggered");

      oledAlarm.textContent = "ON";

      setSoundState("ON");

      sendToESP32("/alarm/on");

    } else {

      alarmStatus.textContent = "OFF";

      alarmIndicator.textContent = "SAFE";
      alarmIndicator.classList.remove("triggered");
      alarmIndicator.classList.add("safe");

      summaryAlarm.textContent = "OFF";
      summaryAlarm.classList.remove("triggered");
      summaryAlarm.classList.add("safe");

      oledAlarm.textContent = "OFF";

      setSoundState("OFF");

      sendToESP32("/alarm/off");
    }
  }

  alarmOn.addEventListener("click", () => {
    setAlarmState("ON");
  });

  alarmOff.addEventListener("click", () => {
    setAlarmState("OFF");
  });


  // ==============================
  // MOTION SENSOR
  // ==============================

  const motionIndicator = document.getElementById("motionIndicator");
  const motionStatus = document.getElementById("motionStatus");

  const oledMotion = document.getElementById("oledMotion");
  const summaryMotion = document.getElementById("summaryMotion");

  function updateMotionStatus(detected) {

    if (detected) {

      motionIndicator.textContent = "TRIGGERED";
      motionIndicator.classList.remove("safe");
      motionIndicator.classList.add("triggered");

      motionStatus.textContent = "DETECTED";

      oledMotion.textContent = "DETECTED";

      summaryMotion.textContent = "TRIGGERED";
      summaryMotion.classList.remove("safe");
      summaryMotion.classList.add("triggered");

    } else {

      motionIndicator.textContent = "SAFE";
      motionIndicator.classList.remove("triggered");
      motionIndicator.classList.add("safe");

      motionStatus.textContent = "NOT DETECTED";

      oledMotion.textContent = "SAFE";

      summaryMotion.textContent = "SAFE";
      summaryMotion.classList.remove("triggered");
      summaryMotion.classList.add("safe");
    }
  }


  // ==============================
  // TEMPERATURE
  // ==============================

  const temperature = document.getElementById("temperature");
  const oledTemperature = document.getElementById("oledTemperature");
  const summaryTemperature = document.getElementById("summaryTemperature");

  function updateTemperature(value) {

    temperature.textContent = value;
    oledTemperature.textContent = value;
    summaryTemperature.textContent = `${value} °C`;
  }


  // Temporary demonstration values
  updateTemperature("--");
  updateMotionStatus(false);


  // ==============================
  // ESP32 COMMUNICATION
  // ==============================

  async function sendToESP32(endpoint) {

    const ip = localStorage.getItem("esp32Ip");

    if (!ip) {
      console.log("ESP32 IP address not configured.");
      return;
    }

    try {

      const response = await fetch(`http://${ip}${endpoint}`, {
        method: "GET"
      });

      if (!response.ok) {
        throw new Error("ESP32 request failed.");
      }

      console.log(`ESP32: ${endpoint}`);

    } catch (error) {

      console.error(
        "Unable to communicate with ESP32:",
        error
      );
    }
  }


  // ==============================
  // OPTIONAL ESP32 STATUS POLLING
  // ==============================

  async function getESP32Status() {

    const ip = localStorage.getItem("esp32Ip");

    if (!ip) {
      return;
    }

    try {

      const response = await fetch(
        `http://${ip}/status`
      );

      if (!response.ok) {
        throw new Error("Status request failed.");
      }

      const data = await response.json();

      // Example expected ESP32 response:
      //
      // {
      //   "motion": true,
      //   "temperature": 28.5
      // }

      if (typeof data.motion !== "undefined") {
        updateMotionStatus(data.motion);
      }

      if (typeof data.temperature !== "undefined") {
        updateTemperature(data.temperature);
      }

    } catch (error) {

      console.log(
        "ESP32 status unavailable."
      );
    }
  }

  // Check ESP32 every 2 seconds
  setInterval(getESP32Status, 2000);

});