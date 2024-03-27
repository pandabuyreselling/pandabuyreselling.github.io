document.addEventListener('DOMContentLoaded', function () {
    loadOrders();

    document.getElementById('addOrder').addEventListener('click', function() {
        toggleModal(true);

        
    var imageInput = document.getElementById('imageInput');

    // Listen for paste events on the imageInput field
    imageInput.addEventListener('paste', function(event) {
        event.preventDefault(); // Prevent the default paste action
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        for (var index in items) {
            var item = items[index];
            if (item.kind === 'file') {
                var blob = item.getAsFile();
                if (blob && blob.type.startsWith('image/')) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        // Set the Data URL as the input field's value
                        imageInput.value = e.target.result;
                    };
                    reader.readAsDataURL(blob);
                } else {
                    alert('Please paste an image file.'); // You can use a more sophisticated method to display this message
                }
            }
        }
    });
});
});


function toggleModal(show) {
    const modal = document.getElementById('addOrderModal');
    modal.style.display = show ? 'block' : 'none';
}

// function submitOrder(orderId = null) {
//     const imageInput = document.getElementById('imageInput').value;
//     const descriptionInput = document.getElementById('descriptionInput').value;
//     const priceInput = document.getElementById('priceInput').value;
//     const noteInput = document.getElementById('noteInput').value;
//     const weightInput = document.getElementById('weightInput').value;
//     const statusState = 'Unpaid'

//     // Prepare the order data
//     const orderData = {
//         image: imageInput,
//         description: descriptionInput,
//         price: priceInput,
//         note: noteInput,
//         weight: weightInput,
//         status: statusState
//     };

//     // Use Fetch API to send a POST request to your backend
//     fetch('http://localhost:3000/orders', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(orderData),
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log('Order added:', data);
//         // Refresh the orders display to show the newly added order
//         loadOrders();
//         // Close the modal and reset the form
//         document.getElementById('orderForm').reset();
//         toggleModal(false);
//     })
//     .catch((error) => {
//         console.error('Error adding order:', error);
//     });
// }

function submitOrder(orderId = null) {
    const imageInput = document.getElementById('imageInput').value;
    const descriptionInput = document.getElementById('descriptionInput').value;
    const priceInput = document.getElementById('priceInput').value;
    const noteInput = document.getElementById('noteInput').value;
    const weightInput = document.getElementById('weightInput').value;
    
    const orderData = {
        image: imageInput,
        description: descriptionInput,
        price: priceInput,
        note: noteInput,
        weight: weightInput,
        // Add status if needed
    };

    const url = orderId ? `http://localhost:3000/orders/${orderId}` : 'http://localhost:3000/orders';
    const method = orderId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save the order');
        }
        return response.json();
    })
    .then(data => {
        console.log('Order saved:', data);
        loadOrders();
        toggleModal(false);
        document.getElementById('orderForm').reset(); // Reset form fields after successful save
    })
    .catch((error) => {
        console.error('Error saving order:', error);
    });
}

function addOrderToPage(orderData) {
    const ordersList = document.getElementById('ordersList');
    const orderDiv = document.createElement('div');
    orderDiv.id = `order-${orderData.id}`;
    orderDiv.className = 'order';
    
    const imgElement = document.createElement('img');
    imgElement.src = orderData.image;
    imgElement.alt = "Order Image";
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'order-info';
    
    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = "Item Name: " + orderData.description;
    
    const priceElement = document.createElement('p');
    priceElement.textContent = "Price: $" + orderData.price + " AUD";
    
    const noteElement = document.createElement('p');
    noteElement.textContent = "Notes: " + orderData.note;

    infoDiv.appendChild(descriptionElement);
    infoDiv.appendChild(priceElement);
    infoDiv.appendChild(noteElement);

    const actionDiv = document.createElement('div');
    actionDiv.className = 'order-action';
    
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.onclick = function() { editOrder(orderData.id); };
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = function() { deleteOrder(orderData.id); };

    actionDiv.appendChild(editButton);
    actionDiv.appendChild(deleteButton);

    orderDiv.appendChild(imgElement);
    orderDiv.appendChild(infoDiv);
    orderDiv.appendChild(actionDiv);
    
    ordersList.appendChild(orderDiv);
}

function loadOrders() {
    fetch('http://localhost:3000/orders')
    .then(response => response.json())
    .then(data => {
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = ''; // Clear existing orders
        data.orders.forEach(orderData => {
            addOrderToPage(orderData);
        });
    })
    .catch((error) => {
        console.error('Error fetching orders:', error);
    });
}

function deleteOrder(orderId) {
    // Check if the logged-in user is "ryan.xva"
    const loggedInUser = localStorage.getItem('panda-loggedInAs');
    if (loggedInUser !== 'ryan.xva') {
        alert("You are not authorized to delete orders.");
        return; // Exit the function if not authorized
    }

    // If authorized, proceed with the deletion
    fetch(`http://localhost:3000/orders/${orderId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete the order');
        }
        // Refresh the orders display to remove the deleted order
        loadOrders();
    })
    .catch((error) => {
        console.error('Error deleting order:', error);
    });
}

function editOrder(orderId) {
    // Fetch the order details from the backend using orderId
    fetch(`http://localhost:3000/orders/${orderId}`)
    .then(response => response.json())
    .then(orderToEdit => {
        if (orderToEdit) {
            document.getElementById('imageInput').value = orderToEdit.image || '';
            document.getElementById('descriptionInput').value = orderToEdit.description;
            document.getElementById('priceInput').value = orderToEdit.price;
            document.getElementById('noteInput').value = orderToEdit.note || '';
            document.getElementById('weightInput').value = orderToEdit.weight;
            toggleModal(true);

            // Directly handle order update within this function
            const submitButton = document.querySelector('#orderForm button[type="button"]');
            submitButton.onclick = function() {
                // Gather updated order details from the form
                const updatedOrderData = {
                    image: document.getElementById('imageInput').value,
                    description: document.getElementById('descriptionInput').value,
                    price: document.getElementById('priceInput').value,
                    note: document.getElementById('noteInput').value,
                    weight: document.getElementById('weightInput').value,
                    status: orderToEdit.status 
                };

                // Send a PUT request to update the order in the backend
                fetch(`http://localhost:3000/orders/${orderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedOrderData),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to update the order');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Order updated:', data);
                    // Optionally, refresh the orders list or close the modal
                    toggleModal(false);
                    // Reload or refresh orders list if needed
                })
                .catch((error) => {
                    console.error('Error updating order:', error);
                });
            };
        }
    })
    .catch(error => console.error('Error fetching order details:', error));
}