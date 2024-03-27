document.addEventListener('DOMContentLoaded', function() {
    loadOrdersFromLocalStorage();
});

function loadOrdersFromLocalStorage() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const tableBody = document.getElementById('calculationsTable').getElementsByTagName('tbody')[0];

    orders.forEach(order => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = order.name; // Ensure your order objects have a 'name' property
        row.insertCell(1).textContent = `$${order.price.toFixed(2)}`;
        
        const weightInputCell = row.insertCell(2);
        const weightInput = document.createElement('input');
        weightInput.type = 'number';
        weightInput.placeholder = 'Enter Weight';
        weightInput.value = order.weight || '';
        weightInputCell.appendChild(weightInput);

        const actionCell = row.insertCell(3);
        const calculateButton = document.createElement('button');
        calculateButton.textContent = 'Calculate Total';
        calculateButton.addEventListener('click', () => calculateTotalPrice(order, weightInput.value));
        actionCell.appendChild(calculateButton);
    });
}

function calculateTotalPrice(order, weight) {
    if (!weight) {
        showErrorPopup('Please enter a weight for the product.');
        return;
    }

    // Mock calculation for demonstration; replace with your actual logic
    const shippingCost = calculateShippingCost(weight);
    const totalPrice = order.price + shippingCost;

    showTotalPriceModal(totalPrice, shippingCost);
}

function calculateShippingCost(weight) {
    const initialCost = 5.02;
    const additionalCost = 2.12;
    const carrierProcFee = 7.31;
    const operationFee = 1.99;
    return weight <= 100 ? initialCost + carrierProcFee + operationFee : initialCost + Math.ceil((weight - 100) / 100) * additionalCost + carrierProcFee + operationFee;
}

function toggleErrorPopup(show) {
    document.getElementById('errorPopup').style.display = show ? 'block' : 'none';
}

function showErrorPopup(message) {
    document.getElementById('errorMessage').textContent = message;
    toggleErrorPopup(true);
}

function toggleTotalPriceModal(show) {
    document.getElementById('totalPriceModal').style.display = show ? 'block' : 'none';
}

function showTotalPriceModal(totalPrice, shippingCost) {
    document.getElementById('totalPrice').textContent = `Total Price: $${totalPrice.toFixed(2)} (Shipping: $${shippingCost.toFixed(2)})`;
    toggleTotalPriceModal(true);
}
