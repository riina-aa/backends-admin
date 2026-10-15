import "../scss/main.scss";

document.addEventListener("DOMContentLoaded", () => {
    init();
})

function init() {

    const loginForm = document.querySelector("#loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", loginUser);
    }

    const registerForm = document.querySelector("#addUser-form");

    if (registerForm) {
        registerForm.addEventListener("submit", registerUser)
    }

    const form = document.querySelector("#addProduct");

    if (form) {
        form.addEventListener("submit", addProducts)
    }

    const userList = document.querySelector("#userList");

    if (userList) {
        fetchUsers();
    };

    const menuList = document.querySelector(".menu-overview"); 

    if (menuList) {
        fetchProducts();
    }
};

async function loginUser(e) {

    e.preventDefault();

    let userInput = document.querySelector("#login-username").value;
    let passwordInput = document.querySelector("#login-password").value;

    if (!userInput || !passwordInput) {

        const errorContainer = document.querySelector(".error-container");

        errorContainer.textContent = `Du måste fylla i användarnamn och lösenord.`
        return;
    }

    let user = {
        username: userInput,
        password: passwordInput
    }

    try {
        const resp = await fetch("http://localhost:3000/greenhouse/login", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(user)
        });

        if (resp.ok) {
            const data = await resp.json();
            localStorage.setItem("greenhouse-token", data.response.token);
            window.location.href = "menu.html"
        }

    } catch (error) {
        throw error;
    }
};

async function registerUser(e) {

    e.preventDefault();

    let userInput = document.querySelector("#register-username").value;
    let passwordInput = document.querySelector("#register-password").value;
    const errorContainer = document.querySelector("#register-messages");

    if (!userInput || !passwordInput) {

        errorContainer.innerHTML = `
            <p>Du måste fylla i användarnamn och lösenord</p>
        `;

        return;
    };

    let user = {
        username: userInput,
        password: passwordInput
    }

    try {
        const resp = await fetch("http://localhost:3000/greenhouse/register", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(user)
        });

        if (resp.ok) {
            const data = await resp.json();

            errorContainer.innerHTML = `
            <p>${data.message}</p>
            `
        }

    } catch (error) {
        throw error;
    }
}

async function fetchUsers() {

    const token = localStorage.getItem("greenhouse-token");

    let result = await fetch("http://localhost:3000/greenhouse/users", {
        method: "GET",
        headers: {
            authorization: "Bearer " + token
        }
    });

    let data = await result.json();

    renderUserList(data);
};

async function renderUserList(users) {

    const selectedList = document.querySelector("#userList");

    if (!selectedList) return;

    selectedList.innerHTML = ""; //Tömmer listan innan ny rendering

    users.forEach((user) => {

        selectedList.innerHTML += `
        <article class="user-info">
            <div class="information">
                <p class="displayUsername">Användarnamn: ${user.username}</p>
            </div>
            <button data-id="${user._id}" type="button" class="deleteBtn">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </article>
        `
    });

    addDeleteListeners();
};

function addDeleteListeners() {

    const deleteButtons = document.querySelectorAll(".deleteBtn");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = button.dataset.id;

            deleteUser(id);
        })
    })
};

async function deleteUser(id) {

    const token = localStorage.getItem("greenhouse-token");

    try {
        const response = await fetch(`http://localhost:3000/greenhouse/users/${id}`, {
            method: "DELETE",
            headers: {
                authorization: "Bearer " + token
            }
        });

        if (response.ok) {
            fetchUsers();
        }

    } catch (error) {
        console.log(error);
    }
}

async function addProducts(e) {

    e.preventDefault();

    let pName = document.querySelector("#product-name").value;
    let pDescription = document.querySelector("#description").value;
    let pPrice = document.querySelector("#price").value;
    let pCategory = document.querySelector("#category").value;
    let pAllergies = document.querySelector("#allergies").value;
    let pImage = document.querySelector("#image").value;
    let pAvailable = document.querySelector("#available").value;
    const messageContainer = document.querySelector(".error-container");

    if (!pName || !pDescription || !pPrice || !pCategory || !pAllergies || !pImage || !pAvailable) {
        messageContainer.textContent = `Du måste fylla i alla fälten.`
        return;
    }

    let product = {
        productName: pName,
        description: pDescription,
        price: pPrice,
        category: pCategory,
        allergies: pAllergies,
        image: pImage,
        available: pAvailable
    }

    const token = localStorage.getItem("greenhouse-token");

    try {
        const resp = await fetch("http://localhost:3000/greenhouse/products", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authorization": "Bearer " + token
            },
            body: JSON.stringify(product)
        });

        if (resp.ok) {
            const data = await resp.json();

            messageContainer.innerHTML = `
            <p>${data.message}</p>
            `
            const form = document.querySelector("#addProducts");

            fetchProducts();
            form.reset();
        }

    } catch (error) {
        console.log(error)
    }
};

async function fetchProducts() {

    const token = localStorage.getItem("greenhouse-token");

    let result = await fetch("http://localhost:3000/greenhouse/products", {
        method: "GET",
        headers: {
            authorization: "Bearer " + token
        }
    });

    let data = await result.json();

    console.log(data)
    renderProducts(data);
}

function renderProducts(products) {

    const selectedList = document.querySelector(".menu-overview");

    if (!selectedList) return;

    selectedList.innerHTML = ""; //Tömmer listan innan ny rendering


    const groupedProducts = products.reduce((groups, product) => {

        const category = product.category;

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push(product);

        return groups;
    }, {});

    Object.entries(groupedProducts).forEach(([category, products]) => {

        const categorySection = document.createElement("section");
        categorySection.classList.add("menu-category");

        categorySection.innerHTML = `
            <h2>${category}</h2>
            <div class="category-products"></div>
        `;

        const productContainer = categorySection.querySelector(".category-products");

        products.forEach((product) => {
            productContainer.innerHTML += `
                <article class="menu-product">
                    <img src="" alt="">
                    <h3>${product.productName}</h3>
                    <p>${product.description}</p>
                    <p class="price">${product.price} kr</p>
                </article>
            `;
        });

        selectedList.appendChild(categorySection);
    });
};

