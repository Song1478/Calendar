const nowDate = new Date();
const nowYear = nowDate.getFullYear();
let currentMonth = nowDate.getMonth();
let HoliDays = [];
let selectedDay;

window.onload = defineCalendar(nowYear, currentMonth + 1);

// 로컬 스토리지에서 데이터 마운트
const userPlanString = localStorage.getItem(`userPlan`);
let userPlanObj = JSON.parse(userPlanString) || [];

function isPlanAddModalVisible(state) {
  const modalDisplay = document.getElementById("plan-add-modal-wrap");
  const planColor = document.getElementById("plan-color");
  const planTitle = document.getElementById("title-txt");
  const planSubject = document.getElementById("subject");
  const planTimeStart = document.getElementById("time-start");
  const planTimeEnd = document.getElementById("time-end");
  const planLocation = document.getElementById("location-input");
  const btnDisplayR = document.getElementById("bwrap");
  const btnDisplayF = document.getElementById("bwrap2");

  if (state) {
    modalDisplay.style.display = "flex";
    btnDisplayR.style.display = "block";
    btnDisplayF.style.display = "none";
  } else {
    modalDisplay.style.display = "none";
    planColor.value = "";
    planTitle.value = "";
    planSubject.value = "";
    planTimeStart.value = "";
    planTimeEnd.value = "";
    planLocation.value = "";
  }
}

// 일정 가시화
function refreshCalPlan() {
  const lastDay = new Date(nowYear, currentMonth + 1, 0).getDate(); // 해당 월의 마지막 날

  // 달력 일정 가시화 초기화
  for (var dayIndex = 1; dayIndex <= lastDay; dayIndex++) {
    document.getElementById(`date-${dayIndex}-plan`).innerHTML = "";
  }

  // 공휴일 일정 등록
  for (var dayoffIndex = 0; dayoffIndex < HoliDays.length; dayoffIndex++) {
    const dateNum = Number(HoliDays[dayoffIndex].dateString.slice(-2));
    document.getElementById(
      `date-${dateNum}-plan`
    ).innerHTML = `<div class="plan-item" style="box-shadow: 0 0 0 2px red inset"><span class="dayoff">${HoliDays[dayoffIndex].dateName}</span></div>`;
  }

  // 사용자 일정 등록
  for (var dayIndex = 1; dayIndex <= lastDay; dayIndex++) {
    const nowDate = new Date(nowYear, currentMonth, dayIndex);

    for (var index = 0; index < userPlanObj.length; index++) {
      const planStart = new Date(userPlanObj[index].planTimeStart);
      const planEnd = new Date(userPlanObj[index].planTimeEnd);
      planStart.setHours(0, 0, 0, 0);
      planEnd.setHours(0, 0, 0, 0);

      if (nowDate >= planStart && nowDate <= planEnd) {
        const targetDateCell = document.getElementById(`date-${dayIndex}-plan`);
        targetDateCell.innerHTML += `<div class="plan-item" style="box-shadow: 0 0 0 2px ${userPlanObj[index].planColor} inset"><span>${userPlanObj[index].planTitle}</span></div>`;
      }
    }
  }
}

//plan-item -> 달력에들어가는 색깔줄 일정표시.
/**
 * 달력 클릭했을 때 객체 활성/비활성 하는 함수
 * @param {number} year 클릭한 대상의 년도
 * @param {number} month 클릭한 대상의 달
 * @param {number} date 클릭한 대상의 일자
 */
function getPlan(year, month, date) {
  const lastDay = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날
  const selectedDate = new Date(year, month, date);
  const targetDateDiv = document.getElementById(`date-${date}`); // 클릭한 요소 DOM 객체 가져오기
  const planListUl = document.getElementById("plan-list");
  const selectDateLable = document.getElementById("select-date-lable");

  planListUl.innerHTML = ""; // 리스트 초기화
  selectDateLable.innerHTML = `${month + 1}월 ${date}일`;

  // 선택한 날짜가 이미 선택돼 있는지 판단
  if (!targetDateDiv.classList.contains("active")) {
    for (var i = 1; i <= lastDay; i++) {
      document.getElementById(`date-${i}`).classList.remove("active");
    }
    targetDateDiv.classList.add("active");
    selectedDay = {
      year: year,
      month: month,
      date: date,
    };
  }

  for (var dayoffIndex = 0; dayoffIndex < HoliDays.length; dayoffIndex++) {
    const dateNum = Number(HoliDays[dayoffIndex].dateString.slice(-2));
    if (selectedDate.getDate() == dateNum) {
      planListUl.innerHTML += `<li><div class="list-contaner"><div class="plan-list-item" onclick="loadEvent(${index})"><span class="plan-item-color" style="background-color: red"></span><span class="plan-item-lable">${HoliDays[dayoffIndex].dateName}</span></div><button class="deleteBtn" onclick="deleteListItem(${index})">ㅡ</button></div></li>`;
    }
  }

  for (var index = 0; index < userPlanObj.length; index++) {
    const planStart = new Date(userPlanObj[index].planTimeStart);
    const planEnd = new Date(userPlanObj[index].planTimeEnd);
    planStart.setHours(0, 0, 0, 0);
    planEnd.setHours(0, 0, 0, 0);

    if (selectedDate >= planStart && selectedDate <= planEnd) {
      planListUl.innerHTML += `<li><div class="list-contaner"><div class="plan-list-item" onclick="loadEvent(${index})"><span class="plan-item-color" style="background-color: ${userPlanObj[index].planColor}"></span><span class="plan-item-lable">${userPlanObj[index].planTitle}</span></div><button class="deleteBtn" onclick="deleteListItem(${index})">ㅡ</button></div></li>`;
    }
  }
}

/**
 * 한국천문연구원 특일정보 API 통신 함수
 * @param {number} year 찾고자하는 년도
 * @param {number} month 찾고자하는 달
 */
function defineCalendar(year, month) {
  // FIXME: 달력을 넘길때마다 API에 통신하는것 고쳐야함 (세션 스토리지에 가져왔던 데이터 저장)
  const parser = new DOMParser();
  const xhr = new XMLHttpRequest();
  const url = "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";
  const holidayArray = [];
  let xmlDoc;
  let queryParams =
    "?" +
    encodeURIComponent("serviceKey") +
    "=" +
    "A172v6vRQ4lqsLTzDqEUDszd%2BiLL5YuAC1%2F%2F57FwMuYKrmF7bxn4R2q4l%2B86cZuuspKxeAGRcwByTcXXCqWNAw%3D%3D";
  queryParams += "&" + encodeURIComponent("solYear") + "=" + encodeURIComponent(`${year}`); // 조회할 년도
  queryParams += "&" + encodeURIComponent("solMonth") + "=" + encodeURIComponent(`${month}`); // 조회할 달
  console.log(`${month}월 - ${url + queryParams}`);

  xhr.open("GET", url + queryParams);
  xhr.onreadystatechange = function () {
    if (this.readyState == 4) {
      xmlDoc = parser.parseFromString(this.response, "text/xml");
      const items = xmlDoc.querySelectorAll("item");
      for (var i = 0; i < items.length; i++) {
        const dateString = items[i].getElementsByTagName("locdate")[0].textContent;
        const dateName = items[i].getElementsByTagName("dateName")[0].textContent;
        holidayArray.push({
          dateString: dateString,
          dateName: dateName,
        });
      }
      HoliDays = holidayArray;
      createCalendar(year, month);
    }
  };
  xhr.send("");
}

/**
 * HTML 페이지에 달력을 생성하는 함수
 * @param {number} year 생성하고자 하는 년도
 * @param {number} month 생성하고자 하는 달
 * @param {Array} holidayArray defineCalendar 에서 가져온 휴일 배열
 */
function createCalendar(year, month) {
  const calendar = document.getElementById("cal-items"); // 달력 DOM 객체
  const firstDay = new Date(year, month - 1, 1); // 해당 월의 첫번째 날
  const lastDay = new Date(year, month, 0); // 해당 월의 마지막 날

  const firstDayOfWeek = firstDay.getDay(); // 첫번째날의 요일을 가져옴
  const lastDate = lastDay.getDate(); // 마지막째날의 날짜를 가져옴

  const totalDays = lastDate + firstDayOfWeek;
  const totalWeeks = Math.ceil(totalDays / 7); // 해당 달에 몇주가 있는지 계산

  let date = 1;

  calendar.innerHTML = ""; // 초기화

  for (var row = 0; row < totalWeeks; row++) {
    const tableRow = document.createElement("tr");
    for (var col = 0; col < 7; col++) {
      const tableCell = document.createElement("td");
      const dayoffString = col == 0 ? " dayoff" : "";

      if (row == 0 && col < firstDay.getDay()) {
        // 이전 달의 날짜
      } else if (date <= lastDate) {
        // 현재 달의 날짜
        tableCell.innerHTML = `<div id="date-${date}" class="cal-item${dayoffString}" onclick="getPlan(${year}, ${
          month - 1
        }, ${date})"><span class="date-num">${date}</span><div id="date-${date}-plan" class="plan-container"></div></div>`;
        date++;
      } else {
        // 다음 달의 날짜
      }
      tableRow.appendChild(tableCell);
    }
    calendar.appendChild(tableRow);
  }
  for (var i = 0; i < HoliDays.length; i++) {
    const dateNum = Number(HoliDays[i].dateString.slice(-2));
    document.getElementById(`date-${dateNum}`).classList.add("dayoff");
  }
  refreshCalPlan();
}

/**
 * 달력 이전 달로 이동시키는 함수 (버튼)
 * @returns
 */
function prevMonth() {
  if (currentMonth < 1) {
    return;
  }
  currentMonth--;
  document.getElementById("month-title").innerHTML = `2023년 ${currentMonth + 1}월`;
  defineCalendar(nowYear, currentMonth + 1);
}

/**
 * 달력 다음 달로 이동시키는 함수 (버튼)
 * @returns
 */
function nextMonth() {
  if (currentMonth >= 11) {
    return;
  }
  currentMonth++;
  document.getElementById("month-title").innerHTML = `2023년 ${currentMonth + 1}월`;
  defineCalendar(nowYear, currentMonth + 1);
}

/**
 * 계획 추가 함수 (버튼)
 * @returns
 */
function savePlan() {
  const planColor = document.getElementById("plan-color").value;
  const planTitle = document.getElementById("title-txt").value;
  const planSubject = document.getElementById("subject").value;
  const planTimeStart = document.getElementById("time-start").value;
  const planTimeEnd = document.getElementById("time-end").value;
  const planLocation = document.getElementById("location-input").value;

  if (!planTitle) {
    alert("일정 제목을 입력해주세요.");
    return;
  }

  if (!planTimeStart) {
    alert("일정 시작 시간을 입력해주세요.");
    return;
  }

  if (!planTimeEnd) {
    alert("일정 종료 시간을 입력해주세요.");
    return;
  }

  const planStart = new Date(planTimeStart);
  const planEnd = new Date(planTimeEnd);
  if (planStart >= planEnd) {
    alert("일정 시작과 종료 시간이 올바르지 않습니다.");
    return;
  }

  /*function clearCalendar() {
    누른 날짜 배열값 받아서 삭제

  }*/
  const saveObj = {
    planColor: planColor,
    planTitle: planTitle,
    planSubject: planSubject,
    planTimeStart: planTimeStart,
    planTimeEnd: planTimeEnd,
    planLocation: planLocation,
  };
  userPlanObj.push(saveObj);
  refreshCalPlan();

  const userPlanString = JSON.stringify(userPlanObj);
  localStorage.setItem("userPlan", userPlanString);

  alert("일정이 등록되었습니다!");
  isPlanAddModalVisible(false);
}

function loadEvent(index) {
  //일정가시화로 추가된 span에 onclick추가하여 note div에 스토리지데이터 로드하는 함수호출

  const modalDisplay = document.getElementById("plan-add-modal-wrap");
  let nTitle = document.getElementById("title-txt");
  let nColor = document.getElementById("plan-color");
  let nSubject = document.getElementById("subject");
  let nLocation = document.getElementById("location-input");
  let nTimeStart = document.getElementById("time-start");
  let nTimeEnd = document.getElementById("time-end");
  const btnDisplayR = document.getElementById("bwrap");
  const btnDisplayF = document.getElementById("bwrap2");
  const fixBtn = document.getElementById("fix-plan");

  let arrNum = null;

  arrNum = index;

  if (modalDisplay.style.display == "none") {
    modalDisplay.style.display = "flex";
    btnDisplayR.style.display = "none";
    btnDisplayF.style.display = "block";

    nTitle.value = userPlanObj[index].planTitle;
    nSubject.value = userPlanObj[index].planSubject;
    nLocation.value = userPlanObj[index].planLocation;
    nTimeStart.value = userPlanObj[index].planTimeStart;
    nTimeEnd.value = userPlanObj[index].planTimeEnd;
    nColor.value = userPlanObj[index].planColor;
  } else {
    modalDisplay.style.display = "none";
  }

  console.log(index);
  console.log(userPlanObj[index]);
  console.log(nTimeEnd);
  console.log(arrNum);

  fixBtn.addEventListener("click", function () {
    fixPlan(arrNum);
  });
}

function fixPlan(a) {
  let nTitle = document.getElementById("title-txt");
  let nColor = document.getElementById("plan-color");
  let nSubject = document.getElementById("subject");
  let nLocation = document.getElementById("location-input");
  let nTimeStart = document.getElementById("time-start");
  let nTimeEnd = document.getElementById("time-end");

  userPlanObj[a].planTitle = nTitle.value;
  userPlanObj[a].planSubject = nSubject.value;
  userPlanObj[a].planLocation = nLocation.value;
  userPlanObj[a].planTimeStart = nTimeStart.value;
  userPlanObj[a].planTimeEnd = nTimeEnd.value;
  userPlanObj[a].planColor = nColor.value;

  const userPlanString = JSON.stringify(userPlanObj);
  localStorage.setItem("userPlan", userPlanString);
  alert("수정이 완료되었습니다");
  isPlanAddModalVisible(false);
  location.reload();
}

function deleteListItem(index) {
  var indexToDelete = index;

  if (indexToDelete >= 0 && indexToDelete < userPlanObj.length) {
    userPlanObj.splice(indexToDelete, 1);
  }

  const userPlanString = JSON.stringify(userPlanObj);
  localStorage.setItem("userPlan", userPlanString);

  alert("삭제완료");
  location.reload();
}

function planDelete() {
  const deleteButtons = document.querySelectorAll(".deleteBtn");

  deleteButtons.forEach((deleteButton) => {
    if (deleteButton.style.display === "none") {
      deleteButton.style.display = "block";
    } else {
      deleteButton.style.display = "none";
    }
  });
}

function accountCal() {
  //수입,지출 합계계산.
  var plus = document.getElementById("plus").value;
  var minus = document.getElementById("minus").value;
  var plusacc = 0;
  var minusacc = 0;
  var totalacc = 0;

  //for-> plusacc 값을 ->i~ 31일까지 합계총액 마찬가지로 minus 똑같다.  total =
  //매일매일의 합계도.

  plusacc += plus; //한달 수입
  minusacc += minus; //한달 지출
  totalacc = plusacc - minusacc; //한달 수입,지출 합계 배열값.
}
