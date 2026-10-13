import "../scss/main.scss";

document.addEventListener("DOMContentLoaded", () => {
    init(); 
})

function init() {

    const form = document.querySelector("#addProduct"); 

    if (form) {
        form.addEventListener("submit", addProducts)
    }
}; 

async function addProducts(e) {

     e.preventDefault(); 

     let pName = document.querySelector("#product-name").value; 
     let pDescription = document.querySelector("#description").value; 
     let pPrice = document.querySelector("#price").value; 
     let pCategory = document.querySelector("#category").value; 
     let pAllergies = document.querySelector("#allergies").value; 
     let pImage = document.querySelector("#image").value; 
     let pAvailable = document.querySelector("#available").value; 
     const messageContainer = document.querySelector("#error-container"); 

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

     const token = localStorage.getItem("webshop-token");

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

            form.reset();
        }

    } catch (error) {
        console.log(error)
    }


    
}