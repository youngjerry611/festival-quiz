const statusBody =
  document.getElementById("status-body");

const statusHead =
  document.getElementById("status-head");

const refreshButton =
  document.getElementById("refresh-button");

const nextButton =
  document.getElementById("next-button");

const previousButton =
  document.getElementById("previous-button");

const rankingButton =
  document.getElementById("ranking-button");

const currentQuestionText =
  document.getElementById("current-question");

const tableTitle =
  document.getElementById("table-title");


let currentQuestion = 1;

let rankingMode = false;


// ==============================
// 현재 문제 불러오기
// ==============================

async function loadCurrentQuestion() {

  const {
    data,
    error
  } = await supabaseClient

    .from("진행상태")

    .select("현재문제")

    .eq("id", 1)

    .maybeSingle();


  if (
    error ||
    !data
  ) {

    console.error(
      error
    );

    return;
  }


  currentQuestion =
    Number(
      data.현재문제
    );


  updateQuestionDisplay();

  updateNextButton();
}


// ==============================
// 현재 문제 표시
// ==============================

function updateQuestionDisplay() {

  if (
    currentQuestion > 10
  ) {

    currentQuestionText.textContent =
      "레크레이션 종료";

  }

  else {

    currentQuestionText.textContent =
      `${currentQuestion}번 문제`;
  }
}


// ==============================
// 다음 버튼 상태
// ==============================

function updateNextButton() {

  if (
    currentQuestion < 10
  ) {

    nextButton.textContent =
      "다음 문제";

    nextButton.disabled =
      false;

  }

  else if (
    currentQuestion === 10
  ) {

    nextButton.textContent =
      "종료";

    nextButton.disabled =
      false;

  }

  else {

    nextButton.textContent =
      "종료됨";

    nextButton.disabled =
      true;
  }
}


// ==============================
// 참가자 + 답안 데이터
// ==============================

async function getGameData() {

  const {
    data: players,
    error: playerError
  } = await supabaseClient

    .from("참가자")

    .select("*");


  if (playerError) {

    console.error(
      playerError
    );

    return null;
  }


  const {
    data: answers,
    error: answerError
  } = await supabaseClient

    .from("답안")

    .select("*");


  if (answerError) {

    console.error(
      answerError
    );

    return null;
  }


  return {
    players,
    answers
  };
}


// ==============================
// 현재 문제 현황
// ==============================

async function loadStatus() {

  rankingMode = false;


  rankingButton.textContent =
    "최종 순위";


  tableTitle.textContent =
    "현재 문제 현황";


  statusHead.innerHTML = `

    <tr>
      <th>참가자</th>
      <th>참가번호</th>
      <th>제출 여부</th>
      <th>제출 답안</th>
      <th>정답 여부</th>
      <th>이번 점수</th>
      <th>누적 점수</th>
    </tr>

  `;


  const gameData =
    await getGameData();


  if (!gameData) {
    return;
  }


  const {
    players,
    answers
  } = gameData;


  statusBody.innerHTML =
    "";


  players
    .sort(
      (a, b) =>
        Number(a.id) -
        Number(b.id)
    )

    .forEach(
      (player) => {


        const playerAnswers =
          answers.filter(
            (answer) =>

              Number(
                answer["참가자 id"]
              )
              ===
              Number(
                player.id
              )
          );


        const currentAnswer =
          playerAnswers.find(
            (answer) =>

              Number(
                answer.문제번호
              )
              ===
              Number(
                currentQuestion
              )
          );


        const totalScore =
          playerAnswers.reduce(
            (
              total,
              answer
            ) =>

              total +
              Number(
                answer.획득점수 || 0
              ),

            0
          );


        const row =
          document.createElement(
            "tr"
          );


        row.innerHTML = `

          <td>
            ${player.name}
          </td>

          <td>
            ${player.participant_code || "-"}
          </td>

          <td>
            ${
              currentAnswer
                ? "제출 완료"
                : "미제출"
            }
          </td>

          <td>
            ${
              currentAnswer
                ? currentAnswer.제출답안
                : "-"
            }
          </td>

          <td>
            ${
              currentAnswer
                ? (
                    currentAnswer.정답여부
                      ? "정답"
                      : "오답"
                  )
                : "-"
            }
          </td>

          <td>
            ${
              currentAnswer
                ? Number(
                    currentAnswer.획득점수 || 0
                  )
                : 0
            }
          </td>

          <td>
            <strong>
              ${totalScore}
            </strong>
          </td>

        `;


        statusBody.appendChild(
          row
        );
      }
    );
}


// ==============================
// 최종 순위
// ==============================

async function loadRanking() {

  rankingMode = true;


  rankingButton.textContent =
    "현재 현황 보기";


  tableTitle.textContent =
    "최종 순위";


  statusHead.innerHTML = `

    <tr>
      <th>순위</th>
      <th>참가자</th>
      <th>참가번호</th>
      <th>누적 점수</th>
    </tr>

  `;


  const gameData =
    await getGameData();


  if (!gameData) {
    return;
  }


  const {
    players,
    answers
  } = gameData;


  const ranking =
    players.map(
      (player) => {


        const playerAnswers =
          answers.filter(
            (answer) =>

              Number(
                answer["참가자 id"]
              )
              ===
              Number(
                player.id
              )
          );


        const totalScore =
          playerAnswers.reduce(
            (
              total,
              answer
            ) =>

              total +
              Number(
                answer.획득점수 || 0
              ),

            0
          );


        return {

          id:
            Number(player.id),

          name:
            player.name,

          code:
            player.participant_code,

          totalScore:
            totalScore
        };
      }
    );


  ranking.sort(
    (a, b) => {

      if (
        b.totalScore !==
        a.totalScore
      ) {

        return (
          b.totalScore -
          a.totalScore
        );
      }


      return (
        a.id -
        b.id
      );
    }
  );


  statusBody.innerHTML =
    "";


  ranking.forEach(
    (
      player,
      index
    ) => {


      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          <strong>
            ${index + 1}위
          </strong>
        </td>

        <td>
          ${player.name}
        </td>

        <td>
          ${player.code || "-"}
        </td>

        <td>
          <strong>
            ${player.totalScore}점
          </strong>
        </td>

      `;


      statusBody.appendChild(
        row
      );
    }
  );
}


// ==============================
// 문제 변경
// ==============================

async function changeQuestion(
  newQuestion
) {

  const {
    error
  } = await supabaseClient

    .from("진행상태")

    .update({
      현재문제:
        newQuestion
    })

    .eq(
      "id",
      1
    );


  if (error) {

    console.error(
      error
    );

    alert(
      "문제 이동 중 오류가 발생했습니다."
    );

    return;
  }


  currentQuestion =
    newQuestion;


  updateQuestionDisplay();

  updateNextButton();


  if (rankingMode) {

    await loadRanking();

  }

  else {

    await loadStatus();
  }
}


// ==============================
// 다음 문제 / 종료
// ==============================

nextButton.addEventListener(
  "click",
  async () => {


    // 1~9번
    if (
      currentQuestion < 10
    ) {

      await changeQuestion(
        currentQuestion + 1
      );

      return;
    }


    // 10번
    if (
      currentQuestion === 10
    ) {

      const endConfirm =
        confirm(
          "레크레이션을 종료하시겠습니까?"
        );


      if (!endConfirm) {
        return;
      }


      // 11 = 종료 상태
      await changeQuestion(11);

      return;
    }
  }
);


// ==============================
// 이전 문제
// ==============================

previousButton.addEventListener(
  "click",
  async () => {

    // 종료 상태 → 10번
    if (
      currentQuestion > 10
    ) {

      await changeQuestion(10);

      return;
    }


    if (
      currentQuestion <= 1
    ) {

      alert(
        "1번이 첫 문제입니다."
      );

      return;
    }


    await changeQuestion(
      currentQuestion - 1
    );
  }
);


// ==============================
// 최종 순위 버튼
// ==============================

rankingButton.addEventListener(
  "click",
  async () => {

    if (rankingMode) {

      await loadStatus();

    }

    else {

      await loadRanking();
    }
  }
);


// ==============================
// 현황 새로고침
// ==============================

refreshButton.addEventListener(
  "click",
  async () => {

    await loadCurrentQuestion();


    if (rankingMode) {

      await loadRanking();

    }

    else {

      await loadStatus();
    }
  }
);


// ==============================
// 시작
// ==============================

async function startAdmin() {

  await loadCurrentQuestion();

  await loadStatus();
}


startAdmin();


// ==============================
// 자동 갱신
// ==============================

setInterval(
  async () => {

    await loadCurrentQuestion();


    if (rankingMode) {

      await loadRanking();

    }

    else {

      await loadStatus();
    }
  },
  2000
);
