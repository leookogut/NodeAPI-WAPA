const tbody = document.querySelector("tbody");
const addForm = document.querySelector(".add-form");
//const inputTask = document.querySelector(".input-task");
//const inputQtd = document.querySelector(".input-task2");
//const inputPrice = document.querySelector(".input-task3");
const hostURL = "https://ingressogarantido.up.railway.app";

//const hostURL = "http://localhost:8080";

const fetchTasks = async () => {
    const response = await fetch(`${hostURL}/products`);
    const tasks = await response.json();
    return tasks;
};

const addTask = async (event) => {
    event.preventDefault();

    const task = {
        name: inputTask.value,
        quantity: inputQtd.value,
        price: inputPrice.value,
    };

    await fetch(`${hostURL}/products`, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
    });

    loadTasks();
    //inputTask.value = "";
    //inputTask2.value = "";
    //inputTask3.value = "";
};

const deleteTask = async (id) => {
    await fetch(`${hostURL}/products/${id}`, {
        method: "delete",
    });

    loadTasks();
};

const updateTask = async ({ id, title, status }) => {
    await fetch(`${hostURL}/products/${id}`, {
        method: "put",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status }),
    });

    loadTasks();
};

const formatDate = (dateUTC) => {
    const options = { dateStyle: "long", timeStyle: "short" };
    const date = new Date(dateUTC).toLocaleString("pt-br", options);
    return date;
};

const createElement = (tag, innerText = "", innerHTML = "") => {
    const element = document.createElement(tag);

    if (innerText) {
        element.innerText = innerText;
    }

    if (innerHTML) {
        element.innerHTML = innerHTML;
    }

    return element;
};

const createSelect = (value) => {
    const options = `
      <option value="pendente">pendente</option>
      <option value="em andamento">em andamento</option>
      <option value="concluída">concluída</option>
    `;

    const select = createElement("select", "", options);

    select.value = value;

    return select;
};

const createRow = (task) => {
    const { _id, seller_name, seller_phone, createdAt, updatedAt } = task;

    const tr = createElement("tr");
    const tdId = createElement("td", _id);
    const tdTitle = createElement("td", seller_name);
    const tdCreatedAt = createElement("td", formatDate(createdAt));
    const tdPhone = createElement("td", seller_phone);
    const tdStatus = createElement("td");
    const tdActions = createElement("td");

    const select = createSelect(formatDate(updatedAt));

    select.addEventListener("change", ({ target }) =>
        updateTask({ ...task, updatedAt: target.value })
    );

    const editButton = createElement(
        "button",
        "",
        '<span class="material-symbols-outlined">edit</span>'
    );
    const deleteButton = createElement(
        "button",
        "",
        '<span class="material-symbols-outlined">delete</span>'
    );

    const editForm = createElement("form");
    const editInput = createElement("input");

    editInput.value = seller_name;
    editForm.appendChild(editInput);

    editForm.addEventListener("submit", (event) => {
        event.preventDefault();

        updateTask({ _id, seller_name: editInput.value, updatedAt });
    });

    editButton.addEventListener("click", () => {
        tdTitle.innerText = "";
        tdTitle.appendChild(editForm);
    });

    editButton.classList.add("btn-action");
    deleteButton.classList.add("btn-action");

    deleteButton.addEventListener("click", () => deleteTask(_id));

    tdStatus.appendChild(select);

    tdActions.appendChild(editButton);
    tdActions.appendChild(deleteButton);

    tr.appendChild(tdId);
    tr.appendChild(tdCreatedAt);
    tr.appendChild(tdTitle);
    tr.appendChild(tdPhone);
    tr.appendChild(tdStatus);
    tr.appendChild(tdActions);

    return tr;
};

const loadTasks = async () => {
    const tasks = await fetchTasks();

    tbody.innerHTML = "";

    tasks.forEach((task) => {
        const tr = createRow(task);
        tbody.appendChild(tr);
    });
};

//addForm.addEventListener("submit", addTask);

loadTasks();

function timedRefresh(timeoutPeriod) {
    setTimeout("location.reload(true);", timeoutPeriod);
}

window.onload = timedRefresh(20000);
