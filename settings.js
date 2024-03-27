document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:3000/settings')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch settings');
        }
        return response.json();
    })
    .then(settings => {
        // Load settings into form fields
        Object.entries(settings).forEach(([key, value]) => {
            const input = document.getElementById(key);
            if (input) {
                input.value = value;
            }
        });
    })
    .catch(error => console.error('Error loading settings:', error));

    const settingsFields = ['markupRate', 'shippingInitCost', 'additionalCost', 'carrierProcFee', 'operationFee'];

    document.getElementById('saveSettings').addEventListener('click', function() {
        const updatedSettings = {};

        let allFilled = true;
        settingsFields.forEach(field => {
            const value = document.getElementById(field).value;
            if (!value) {
                allFilled = false;
                alert(`Please enter a value for ${field}.`);
                return;
            }
            updatedSettings[field] = value;
        });

        if (allFilled) {
            // Send the updated settings to the server
            fetch('http://localhost:3000/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedSettings),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save settings');
                }
                return response.json();
            })
            .then(() => {
                alert('Settings saved successfully!');
            })
            .catch(error => console.error('Error saving settings:', error));
        }
    });
});
