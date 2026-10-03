const loginButton =
  document.getElementById("login-button");

const nameInput =
  document.getElementById("name-input");

const codeInput =
  document.getElementById("code-input");

const loginScreen =
  document.getElementById("login-screen");

const answerScreen =
  document.getElementById("answer-screen");

const endScreen =
  document.getElementById("end-screen");

const playerNameText =
  document.getElementById("player-name");

const playerCodeText =
  document.getElementById("player-code");

const questionNumberText =
  document.getElementById("question-number");

const questionPointsText =
  document.getElementById("question-points");

const answerInput =
  document.getElementById("answer-input");

const submitButton =
  document.getElementById("submit-button");

const message =
  document.getElementById("message");


// 참가자 정보 수정
const editPlayerButton =
  document.getElementById("edit-player-button");

const editScreen =
  document.getElementById("edit-screen");

const editNameInput =
  document.getElementById("edit-name-input");

const editCodeInput =
  document.getElementById("edit-code-input");

const savePlayerButton =
  document.getElementById("save-player-button");

const cancelEditButton =
  document.getElementById("cancel-edit-button");


let playerId = null;
let playerName = "";
let participantCode = "";

let currentQuestion = 1;

let submitted = false;


// ==============================
// 현재 문제 번호 가져오기
// ==============================

async function getCurrentQuestion() {

  const { data, error } =
    await supabaseClient
      .from("진행상태")
      .select("현재문제")
      .eq("id", 1)
      .maybeSingle();


  if (error) {

    console.error(
      "현재 문제 조회 오류:",
      error
    );

    return null;
  }


  if (!data) {
    return null;
  }


  return Number(
    data.현재문제
  );
}


// ==============================
// 현재 문제 배점 표시
// ==============================

async function loadQuestionPoints() {

  if (currentQuestion > 10) {
    return;
  }


  const { data, error } =
    await supabaseClient
      .from("questions")
      .select("points")
      .eq(
        "question_number",
        currentQuestion
      )
      .maybeSingle();


  if (error) {

    console.error(
      "배점 조회 오류:",
      error
    );

    return;
  }


  if (data) {

    questionPointsText.textContent =
      data.points;
  }
}


// ==============================
// 참가자 입장
// ==============================

loginButton.addEventListener(
  "click",
  async () => {

    const name =
      nameInput.value.trim();

    const code =
      codeInput.value.trim();


    if (name === "") {

      alert(
        "닉네임을 입력해주세요."
      );

      return;
    }


    if (code === "") {

      alert(
        "고유번호를 입력해주세요."
      );

      return;
    }


    loginButton.disabled = true;

    loginButton.textContent =
      "확인 중...";


    // 같은 고유번호 확인
    const {
      data: codePlayer,
      error: codeError
    } = await supabaseClient

      .from("참가자")

      .select("*")

      .eq(
        "participant_code",
        code
      )

      .maybeSingle();


    if (codeError) {

      console.error(
        codeError
      );

      resetLoginButton();

      return;
    }


    if (
      codePlayer &&
      codePlayer.name !== name
    ) {

      alert(
        "이미 사용 중인 고유번호입니다."
      );

      resetLoginButton();

      return;
    }


    // 같은 닉네임 확인
    const {
      data: namePlayer,
      error: nameError
    } = await supabaseClient

      .from("참가자")

      .select("*")

      .eq(
        "name",
        name
      )

      .maybeSingle();


    if (nameError) {

      console.error(
        nameError
      );

      resetLoginButton();

      return;
    }


    if (
      namePlayer &&
      namePlayer.participant_code !== code
    ) {

      alert(
        "이미 사용 중인 닉네임입니다."
      );

      resetLoginButton();

      return;
    }


    // 기존 참가자
    if (codePlayer) {

      playerId =
        Number(codePlayer.id);

      playerName =
        codePlayer.name;

      participantCode =
        codePlayer.participant_code;

    }

    // 신규 참가자
    else {

      const {
        data: newPlayer,
        error: insertError
      } = await supabaseClient

        .from("참가자")

        .insert([
          {
            name: name,
            participant_code: code
          }
        ])

        .select()

        .single();


      if (insertError) {

        console.error(
          insertError
        );


        if (
          insertError.code === "23505"
        ) {

          alert(
            "이미 사용 중인 닉네임 또는 고유번호입니다."
          );

        }

        else {

          alert(
            "참가자 등록 중 오류가 발생했습니다."
          );
        }


        resetLoginButton();

        return;
      }


      playerId =
        Number(newPlayer.id);

      playerName =
        newPlayer.name;

      participantCode =
        newPlayer.participant_code;
    }


    savePlayerToBrowser();


    const serverQuestion =
      await getCurrentQuestion();


    if (
      serverQuestion !== null
    ) {

      currentQuestion =
        serverQuestion;
    }


    // 이미 종료 상태
    if (currentQuestion > 10) {

      showEndScreen();

      return;
    }


    showAnswerScreen();

    await loadQuestionPoints();

    await checkAlreadySubmitted();

  }
);


function resetLoginButton() {

  loginButton.disabled = false;

  loginButton.textContent =
    "입장하기";
}


// ==============================
// 참가자 정보 브라우저 저장
// ==============================

function savePlayerToBrowser() {

  localStorage.setItem(
    "festival_participant_code",
    participantCode
  );
}


// ==============================
// 답안 화면 표시
// ==============================

function showAnswerScreen() {

  endScreen.classList.add(
    "hidden"
  );


  playerNameText.textContent =
    `${playerName}님`;


  playerCodeText.textContent =
    `참가번호: ${participantCode}`;


  questionNumberText.textContent =
    currentQuestion;


  loginScreen.classList.add(
    "hidden"
  );


  answerScreen.classList.remove(
    "hidden"
  );
}


// ==============================
// 종료 화면
// ==============================

function showEndScreen() {

  loginScreen.classList.add(
    "hidden"
  );


  answerScreen.classList.add(
    "hidden"
  );


  endScreen.classList.remove(
    "hidden"
  );
}


// ==============================
// 참가자 정보 수정 열기
// ==============================

editPlayerButton.addEventListener(
  "click",
  () => {

    editNameInput.value =
      playerName;


    editCodeInput.value =
      participantCode;


    editScreen.classList.remove(
      "hidden"
    );
  }
);


// ==============================
// 정보 수정 취소
// ==============================

cancelEditButton.addEventListener(
  "click",
  () => {

    editScreen.classList.add(
      "hidden"
    );
  }
);


// ==============================
// 참가자 정보 수정 저장
// ==============================

savePlayerButton.addEventListener(
  "click",
  async () => {

    const newName =
      editNameInput.value.trim();

    const newCode =
      editCodeInput.value.trim();


    if (
      newName === "" ||
      newCode === ""
    ) {

      alert(
        "닉네임과 고유번호를 모두 입력해주세요."
      );

      return;
    }


    savePlayerButton.disabled =
      true;

    savePlayerButton.textContent =
      "확인 중...";


    // 고유번호 중복 확인
    const {
      data: sameCode,
      error: codeError
    } = await supabaseClient

      .from("참가자")

      .select("id")

      .eq(
        "participant_code",
        newCode
      )

      .neq(
        "id",
        playerId
      )

      .maybeSingle();


    if (codeError) {

      console.error(
        codeError
      );

      resetSaveButton();

      return;
    }


    if (sameCode) {

      alert(
        "이미 사용 중인 고유번호입니다."
      );

      resetSaveButton();

      return;
    }


    // 닉네임 중복 확인
    const {
      data: sameName,
      error: nameError
    } = await supabaseClient

      .from("참가자")

      .select("id")

      .eq(
        "name",
        newName
      )

      .neq(
        "id",
        playerId
      )

      .maybeSingle();


    if (nameError) {

      console.error(
        nameError
      );

      resetSaveButton();

      return;
    }


    if (sameName) {

      alert(
        "이미 사용 중인 닉네임입니다."
      );

      resetSaveButton();

      return;
    }


    const {
      error: updateError
    } = await supabaseClient

      .from("참가자")

      .update({

        name:
          newName,

        participant_code:
          newCode

      })

      .eq(
        "id",
        playerId
      );


    if (updateError) {

      console.error(
        updateError
      );

      alert(
        "참가자 정보 수정 중 오류가 발생했습니다."
      );

      resetSaveButton();

      return;
    }


    playerName =
      newName;


    participantCode =
      newCode;


    savePlayerToBrowser();


    playerNameText.textContent =
      `${playerName}님`;


    playerCodeText.textContent =
      `참가번호: ${participantCode}`;


    editScreen.classList.add(
      "hidden"
    );


    resetSaveButton();


    alert(
      "참가자 정보가 수정되었습니다."
    );
  }
);


function resetSaveButton() {

  savePlayerButton.disabled =
    false;


  savePlayerButton.textContent =
    "수정 완료";
}


// ==============================
// 답안 제출
// ==============================

submitButton.addEventListener(
  "click",
  async () => {

    if (submitted) {
      return;
    }


    const answer =
      answerInput.value.trim();


    if (answer === "") {

      alert(
        "답변을 입력해주세요."
      );

      return;
    }


    submitted = true;

    submitButton.disabled =
      true;

    answerInput.disabled =
      true;

    submitButton.textContent =
      "제출 중...";


    // 기존 답안 확인
    const {
      data: existingAnswer,
      error: checkError
    } = await supabaseClient

      .from("답안")

      .select("id")

      .eq(
        "참가자 id",
        playerId
      )

      .eq(
        "문제번호",
        currentQuestion
      )

      .maybeSingle();


    if (checkError) {

      console.error(
        checkError
      );

      unlockAnswer();

      return;
    }


    if (existingAnswer) {

      submitted = true;

      submitButton.disabled =
        true;

      answerInput.disabled =
        true;

      submitButton.textContent =
        "제출 완료";

      message.textContent =
        "이미 답안을 제출했습니다.";

      return;
    }


    // 문제 정보 가져오기
    const {
      data: questionData,
      error: questionError
    } = await supabaseClient

      .from("questions")

      .select(
        "correct_answer, points"
      )

      .eq(
        "question_number",
        currentQuestion
      )

      .maybeSingle();


    if (
      questionError ||
      !questionData
    ) {

      console.error(
        questionError
      );

      unlockAnswer();

      alert(
        `${currentQuestion}번 문제 정보가 없습니다.`
      );

      return;
    }


    const userAnswer =
      answer
        .trim()
        .toLowerCase();


    const correctAnswer =
      questionData.correct_answer
        .trim()
        .toLowerCase();


    const isCorrect =
      userAnswer ===
      correctAnswer;


    const earnedPoints =
      isCorrect
        ? Number(
            questionData.points
          )
        : 0;


    // 답안 저장
    const {
      error: saveError
    } = await supabaseClient

      .from("답안")

      .insert([
        {

          "참가자 id":
            playerId,

          참가자이름:
            playerName,

          문제번호:
            currentQuestion,

          제출답안:
            answer,

          정답여부:
            isCorrect,

          획득점수:
            earnedPoints

        }
      ]);


    if (saveError) {

      console.error(
        saveError
      );

      unlockAnswer();

      return;
    }


    submitted = true;


    submitButton.disabled =
      true;


    answerInput.disabled =
      true;


    submitButton.textContent =
      "제출 완료";


    message.textContent =
      "답안이 제출되었습니다.";
  }
);


function unlockAnswer() {

  submitted = false;

  submitButton.disabled =
    false;

  answerInput.disabled =
    false;

  submitButton.textContent =
    "제출";
}


// ==============================
// 이미 제출했는지 확인
// ==============================

async function checkAlreadySubmitted() {

  if (playerId === null) {
    return;
  }


  const {
    data,
    error
  } = await supabaseClient

    .from("답안")

    .select("id")

    .eq(
      "참가자 id",
      playerId
    )

    .eq(
      "문제번호",
      currentQuestion
    )

    .maybeSingle();


  if (error) {

    console.error(
      error
    );

    return;
  }


  if (data) {

    submitted = true;

    answerInput.disabled =
      true;

    submitButton.disabled =
      true;

    submitButton.textContent =
      "제출 완료";

    message.textContent =
      "이미 답안을 제출했습니다.";

  }

  else {

    submitted = false;

    answerInput.value =
      "";

    answerInput.disabled =
      false;

    submitButton.disabled =
      false;

    submitButton.textContent =
      "제출";

    message.textContent =
      "";
  }
}


// ==============================
// 진행자가 문제 변경했는지 확인
// ==============================

async function checkCurrentQuestion() {

  if (playerId === null) {
    return;
  }


  const serverQuestion =
    await getCurrentQuestion();


  if (serverQuestion === null) {
    return;
  }


  // 11 = 종료 상태
  if (serverQuestion > 10) {

    currentQuestion =
      serverQuestion;

    showEndScreen();

    return;
  }


  // 종료 상태에서 이전 문제 복귀
  if (currentQuestion > 10) {

    currentQuestion =
      serverQuestion;

    showAnswerScreen();

    await loadQuestionPoints();

    await checkAlreadySubmitted();

    return;
  }


  if (
    serverQuestion !==
    currentQuestion
  ) {

    currentQuestion =
      serverQuestion;


    questionNumberText.textContent =
      currentQuestion;


    await loadQuestionPoints();

    await checkAlreadySubmitted();
  }
}


// ==============================
// 새로고침 후 참가자 복구
// ==============================

async function restorePlayer() {

  const savedCode =
    localStorage.getItem(
      "festival_participant_code"
    );


  if (!savedCode) {
    return;
  }


  const {
    data,
    error
  } = await supabaseClient

    .from("참가자")

    .select("*")

    .eq(
      "participant_code",
      savedCode
    )

    .maybeSingle();


  if (
    error ||
    !data
  ) {

    return;
  }


  playerId =
    Number(data.id);


  playerName =
    data.name;


  participantCode =
    data.participant_code;


  const serverQuestion =
    await getCurrentQuestion();


  if (
    serverQuestion !== null
  ) {

    currentQuestion =
      serverQuestion;
  }


  if (
    currentQuestion > 10
  ) {

    showEndScreen();

    return;
  }


  showAnswerScreen();

  await loadQuestionPoints();

  await checkAlreadySubmitted();
}


restorePlayer();


setInterval(
  checkCurrentQuestion,
  1000
);
