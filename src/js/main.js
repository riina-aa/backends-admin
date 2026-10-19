import "../scss/main.scss";

document.addEventListener("DOMContentLoaded", () => {
    init();
})

//Globala variabler och arrayer
let allProducts = [];
let selectedProductId = [];
let orders = [];
let selectedOrderId = null;

async function init() {

    const currentPage = window.location.pathname;

    // Sidor som kräver inloggning
    const protectedPages = [
        "/menu.html",
        "/users.html",
        "/orders.html"
    ];

    // Kontrollera bara autentisering på skyddade sidor
    if (protectedPages.includes(currentPage)) {

        const authenticated = await checkAuth();

        if (!authenticated) return;

        document.body.classList.remove("auth-pending");
    }

    const loginForm = document.querySelector("#loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", loginUser);
    }

    const logoutBtn = document.querySelector(".logout-btn")

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
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

        menuList.addEventListener("click", (e) => {

            const button = e.target.closest(".edit-action");

            if (!button) return;

            const productId = button.dataset.id;

            openEditModal(productId);
        })
    }

    const editModal = document.querySelector(".menu-modal");

    if (editModal) {
        const closeBtn = editModal.querySelector(".close-editModal");

        closeBtn.addEventListener("click", () => {
            editModal.close();
        });
    }

    const editModalForm = document.querySelector(".edit-menu-form");

    if (editModalForm) {
        editModalForm.addEventListener("submit", (e) => {
            e.preventDefault();
            updateProduct(e);
        });
    }

    const orderList = document.querySelector(".order-list");

    if (orderList) {
        fetchOrders();

        orderList.addEventListener("click", (e) => {

            const button = e.target.closest(".edit-order");

            if (!button) return;

            const orderId = button.dataset.id;

            openOrderModal(orderId);
        });
    };

    const editForm = document.querySelector("#edit-order-form");

    if (editForm) {
        editForm.addEventListener("submit", updateOrder);
    }

    const deleteBtn = document.querySelector(".delete-order");

    if (deleteBtn) {
        deleteBtn.addEventListener("click", deleteOrder);
    }

    const editMenuDeleteBtn = document.querySelector(".editMenu-deleteBtn"); 

    if (editMenuDeleteBtn) {
        editMenuDeleteBtn.addEventListener("click", deleteProduct)
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

            errorContainer.textContent = "Användaren har sparats."

            const form = document.querySelector("#addUser-form"); 
            form.reset();
        }

    } catch (error) {
        throw error;
    }

    fetchUsers(); 
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
    let pAvailable = document.querySelector("#available").value;
    const messageContainer = document.querySelector(".error-container");

    if (!pName || !pDescription || !pPrice || !pCategory || !pAllergies || !pAvailable) {
        messageContainer.textContent = `Du måste fylla i alla fälten.`
        return;
    }

    let product = {
        productName: pName,
        description: pDescription,
        price: pPrice,
        category: pCategory,
        allergies: pAllergies,
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

            messageContainer.textContent = "Produkten är tillagd."; 

            const form = document.querySelector("#addProduct");

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

    allProducts = await result.json();

    renderProducts(allProducts);
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

        const categoryNames = {
            brunch: "Brunch & Lunch",
            bakery: "Bakelser & Tårtor",
            sourdough: "Surdegsbröd",
            hotDrinks: "Varma drycker",
            coldDrinks: "Kalla drycker",
            cocktails: "Drinkar & Cocktails"
        };

        categorySection.innerHTML = `
            <h2>${categoryNames[category] || category}</h2>
            <div class="category-products"></div>
        `;

        const productContainer = categorySection.querySelector(".category-products");

        products.forEach((product) => {
            productContainer.innerHTML += `
                <article class="menu-product">
                    <div class="menu-title">
                        <h3>${product.productName} | ${product.price} kr</h3>
                        <div class="product-actions">
                            <span class="availability ${product.available ? 'visible' : 'hidden'}">
                                ${product.available ? "Synlig" : "Dold"}
                            </span>
                            <span class="material-symbols-outlined edit-action" data-id="${product._id}">settings</span>
                        </div>
                    </div>
                    <p class="p-description">${product.description}</p>
                </article>
            `;
        });

        selectedList.appendChild(categorySection);
    });
};

async function fetchOrders() {

    const token = localStorage.getItem("greenhouse-token");

    let result = await fetch("http://localhost:3000/greenhouse/orders", {
        method: "GET",
        headers: {
            authorization: "Bearer " + token
        }
    });

    orders = await result.json();

    renderOrders(orders);
};

function renderOrders(orders) {

    const selectedList = document.querySelector(".order-list");

    if (!selectedList) return;

    const statusLabels = {
        new: "Ny beställning",
        confirmed: "Bekräftad till kund",
        inProgress: "Påbörjad",
        ready: "Redo för hämtning",
        completed: "Hämtad och klar",
        cancelled: "Avbokad"
    };

    selectedList.innerHTML = ""; //Tömmer listan innan ny rendering

    orders.forEach((order) => {

        const createdDate = new Date(order.createdAt).toLocaleString("sv-SE", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const updatedDate = new Date(order.updatedAt).toLocaleString("sv-SE", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const deliveryDate = new Date(order.deliveryDate).toLocaleDateString("sv-SE", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        selectedList.innerHTML += `
            <article class="order">
                <div class="title">
                    <div class="row1">
                        <h3>${order.product.productType}</h3>
                        <button class="status-badge ${order.status}">
                            <span class="order-status">
                                ${statusLabels[order.status] ?? "Okänd status"}
                            </span>
                        </button>
                    </div>
                    <div class="row2">
                        <p>${order.customer.name}</p>
                        <p>•</p>
                        <p>Mottagen: ${createdDate}</p>
                    </div>
                </div>
                <div class="order-info">
                    <div class="row3">
                        <div class="details">
                            <p class="info-title">Upphämtning:</p>
                            <p>${deliveryDate}
                        </div>
                        <div class="details">
                            <p class="info-title">Portioner:</p>
                            <p>${order.product.servings}
                        </div>
                        <div class="details">
                            <p class="info-title">Meddelande på tårta:</p>
                            <p>${order.product.message}</p>
                        </div>
                    </div>
                    <div class="row4">
                        <div class="details different">
                            <p class="info-title">Bokningskommentar:</p>
                            <p>${order.comment}</p>
                        </div>
                        <div class="details different">
                            <p class="info-title">Interna anteckningar:</p>
                            <p>${order.staffNotes}</p>
                        </div>
                    </div>
                    <div class="row5">
                        <div class="details different">
                            <p class="info-title">Fullständiga kunduppgifter</p>
                            <p>${order.customer.name}</p>
                            <p>${order.customer.email}</p>
                            <p>${order.customer.phone}</p>
                        </div>
                    </div>
                    <div class="row6">
                        <p>Senast uppdaterad: ${updatedDate}</p>
                        <button class="edit-order" data-id="${order._id}">Redigera bokning</button>
                    </div>
                </div>
            </article>
        `
    });


};

function openOrderModal(orderId) {

    const modal = document.querySelector(".modal");
    modal.showModal();

    const order = orders.find((order) => order._id === orderId);

    if (!order) return;

    selectedOrderId = orderId;

    document.querySelector("#order-status").value = order.status;
    document.querySelector("#staff-notes").value = order.staffNotes || "";

    const closeBtn = document.querySelector(".close-modal");
    closeBtn.addEventListener("click", () => {
        document.querySelector(".modal").close();
    });
};

async function updateOrder(e) {

    e.preventDefault();

    if (!selectedOrderId) return;

    // Hämta värden från formulär
    const status = document.querySelector("#order-status").value;
    const staffNotes = document.querySelector("#staff-notes").value;

    // Hämta token
    const token = localStorage.getItem("greenhouse-token");

    try {
        const response = await fetch(
            `http://localhost:3000/greenhouse/orders/${selectedOrderId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: status,
                    staffNotes: staffNotes
                })
            }
        );

        if (!response.ok) {
            throw new Error("Kunde inte uppdatera beställningen");
        }

        // Stäng modalen
        document.querySelector(".modal").close();

        // Återställ valt ID
        selectedOrderId = null;

        // Hämta och rendera om beställningarna
        await fetchOrders();

    } catch (error) {
        console.error(error);
        alert("Något gick fel när beställningen skulle uppdateras.");
    }
};

async function deleteOrder() {

    if (!selectedOrderId) return;

    // Bekräfta att användaren verkligen vill radera
    const confirmDelete = confirm(
        "Är du säker på att du vill radera beställningen? Detta går inte att ångra."
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem("greenhouse-token");

    try {
        const response = await fetch(
            `http://localhost:3000/greenhouse/orders/${selectedOrderId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Kunde inte radera beställningen");
        }

        // Stäng modalen
        document.querySelector(".modal").close();

        // Återställ valt ID
        selectedOrderId = null;

        // Uppdatera beställningslistan
        await fetchOrders();

    } catch (error) {
        alert("Något gick fel när beställningen skulle raderas.");
    }
}

function openEditModal(productId) {
    const modal = document.querySelector(".menu-modal");
    modal.showModal();

    const product = allProducts.find(product => product._id === productId);

    if (!product) return;

    selectedProductId = productId;

    document.querySelector(".current-item").textContent =
        `Du redigerar just nu: ${product.productName}`;

    document.querySelector("#edit-description").value = product.description;
    document.querySelector("#edit-allergies").value = product.allergies ?? "";
    document.querySelector("#edit-price").value = product.price;
    document.querySelector("#edit-category").value = product.category;
    document.querySelector("#edit-visibility").value = String(product.available);
}

async function updateProduct(e) {

    e.preventDefault();

    if (!selectedProductId) return;

    // Hämta värden från formulär
    const description = document.querySelector("#edit-description").value;
    const allergies = document.querySelector("#edit-allergies").value;
    const price = Number(document.querySelector("#edit-price").value);
    const category = document.querySelector("#edit-category").value;
    const available = document.querySelector("#edit-visibility").value === "true"; 

    // Hämta token
    const token = localStorage.getItem("greenhouse-token");

    try {
        const response = await fetch(
            `http://localhost:3000/greenhouse/products/${selectedProductId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    description: description, 
                    price: price, 
                    category: category, 
                    available: available, 
                    allergies: allergies
                })
            }
        );

        // Stäng modalen
        document.querySelector(".menu-modal").close();

        // Återställ valt ID
        selectedProductId = null;

        // Hämta och rendera om beställningarna
        await fetchProducts();

    } catch (error) {
        console.error(error);
        alert("Något gick fel när beställningen skulle uppdateras.");
    }
    
}

async function deleteProduct() {
    if (!selectedProductId) return;

    const token = localStorage.getItem("greenhouse-token");

    try {
        const response = await fetch(
            `http://localhost:3000/greenhouse/products/${selectedProductId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        // Stäng modalen
        document.querySelector(".menu-modal").close();

        // Återställer ID
        selectedProductId = null;

        // Uppdatera beställningslistan
        await fetchProducts();

    } catch (error) {
        alert("Något gick fel när beställningen skulle raderas.");
    }
}

function logout() {
    localStorage.removeItem("greenhouse-token");

    window.location.href = "/index.html";
}

async function checkAuth() {

    const token = localStorage.getItem("greenhouse-token");

    if (!token) {
        window.location.replace("/index.html");
        return false;
    }

    try {
        const response = await fetch("http://localhost:3000/greenhouse/verify", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem("greenhouse-token");
            window.location.replace("/index.html");
            return false;
        }

        return true;

    } catch (error) {
        console.error("Authentication failed:", error);
        window.location.replace("/index.html");
        return false;
    }
}

