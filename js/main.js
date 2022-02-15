// const termData = [];
const $btnSubmit = document.querySelector("#btn-submit");
const $form = document.querySelector("#form");
const $gradeInput = document.querySelector("#grade");
const $subSelector = document.querySelector("#subject-selector");
const $termSelector = document.querySelector("#term-selector");
const $gradeContainer = document.querySelector(".grade-container");
const $errorMessage = document.querySelector("#error-message");
const $errorRelated = document.querySelector("#error-related");

let subjects = [];

const INITIAL_NEXT_SUBJECT = {
  id: null,
  termId: null,
  name: null,
  uc: null,
  status: "cursando",
  grade: null,
};

const STATE = {
  subjectsDone: {},
  studentSubjects: {},
  nextSubject: INITIAL_NEXT_SUBJECT,
};

const updateNextSubject = (subject) => {
  STATE.nextSubject = {
    ...STATE.nextSubject,
    ...subject,
  };
};

const updateStudentSubject = (termId) => {
  STATE.studentSubjects[termId].push(STATE.nextSubject);
};

const updateSubjectsDone = (id) => {
  STATE.subjectsDone[id] = STATE.nextSubject;
};

const resetNextSubject = () => {
  STATE.nextSubject = INITIAL_NEXT_SUBJECT;
};

// Utils
const isGradeValid = (grade) => !isNaN(grade) && grade >= 0 && grade <= 20;

const hideErrorMessage = () => $errorMessage.classList.add("hidden");

const sortTermSubjects = (termId) => {
  STATE.studentSubjects[termId].sort(function (a, b) {
    return a.id - b.id;
  });
};

// Fill Selectors
const fillTermSelector = (termData) => {
  let html = "<option selected disabled>Trimestre</option>";

  for (const term of termData) {
    html += `<option value="${term.termId}">${term.name}</option>`;
    STATE.studentSubjects[term.termId] = [];
  }

  $termSelector.innerHTML = html;
  $termSelector.disabled = false;
};

const fillSubSelector = (subjects) => {
  let html;

  for (const element of subjects) {
    html += `<option value="${element.id}">${element.name}</option>`;
  }

  if (!subjects.length) {
    html += `<option>No materias</option>`;
    $subSelector.disabled = true;
    $btnSubmit.disabled = true;
  } else {
    $subSelector.disabled = false;
  }

  $subSelector.innerHTML = html;
};

// Get Data
fetch("./db/term.json")
  .then((resp) => resp.json())
  .then((resp) => fillTermSelector(resp));

fetch("./db/data.json")
  .then((resp) => resp.json())
  .then((resp) => (subjects = resp));

// EVENTS
const selectorHandler = (event) => {
  $subSelector.disabled = true;
  $btnSubmit.disabled = false;
  const { target: select } = event;
  const termId = select.options[select.selectedIndex].value;
  const data = subjects.filter((subject) => subject.termId === termId);
  fillSubSelector(data);
  updateNextSubject({ termId });
};

const handlerRadioChange = ({ target }) => {
  const status = target.value;
  if (status === "vista") {
    $gradeContainer.classList.remove("hidden");
  } else {
    $gradeContainer.classList.add("hidden");
  }
  updateNextSubject({ status });
};

const onSubmit = (event) => {
  event.preventDefault();
  let status = STATE.nextSubject.status;
  const grade = +$gradeInput.value || null;

  if (status === "vista" && !isGradeValid(grade)) {
    $errorMessage.classList.remove("hidden");
    return;
  }

  status = status == "vista" ? (grade > 9.5 ? "pass" : "fail") : status;

  const subjectId = $subSelector.options[$subSelector.selectedIndex].value;
  const subject = subjects.find((subject) => subject.id == subjectId);
  const termId = STATE.nextSubject.termId;

  // if (subject.related) {
  //   console.log("HEY");
  //   const data = subjects
  //     .filter((item) => item.id == subject.related)
  //     .map((item) => item.name);

  //   if (data.length) {
  //     console.log(data);
  //     $errorRelated.innerHTML = `Debes ver las siguientes materias: ${data.join(
  //       " "
  //     )}, antes de cursar la materia actual`;
  //     $errorRelated.classList.remove("hidden");
  //     return;
  //   }
  // }

  updateNextSubject({ ...subject, grade, status });
  updateStudentSubject(termId);
  updateSubjectsDone(subject.id);

  subjects = subjects.filter((subject) => subject.id != subjectId);
  const termSubjects = subjects.filter((subject) => subject.termId == termId);
  sortTermSubjects(termId);
  fillSubSelector(termSubjects);
  onUpdateTable();
  resetNextSubject();
  $gradeInput.value = "";
};

// Update Table
const onUpdateTable = () => {
  const terms = Object.keys(STATE.studentSubjects);
  const materiasTrimestre = [];

  for (let index = 0; index < terms.length; index++) {
    materiasTrimestre.push(STATE.studentSubjects[terms[index]].length);
  }

  const maxMaterias = Math.max(...materiasTrimestre);
  let html = "";

  for (let index = 0; index < maxMaterias; index++) {
    html += `<tr>`;
    for (let i = 0; i < terms.length; i++) {
      const subject = STATE.studentSubjects[terms[i]][index];
      html += createTableCell(subject);
    }
    html += `</tr>`;
  }
  document.getElementById("tablebody").innerHTML = html;
};

const createTableCell = (data) => {
  const colors = { pass: "bg-green", fail: "bg-red" };
  if (!data) {
    return "<td></td>";
  }

  return `<td class="${colors[data.status]}">
    ${data.name}
    <br/>
    <span>UC: ${data.uc}</span>
    <br/>
    ${data.grade ? `<span>Nota: ${data.grade}</span>` : ""}
  </td>`;
};
