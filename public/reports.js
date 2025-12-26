const API_BASE_URL = 'http://localhost:3000/api/v1';

let currentReportData = null;
let currentTableType = 'income';

const availableColumns = {
    amount: 'Amount',
    currency: 'Currency',
    createdAt: 'Date',
    user: 'User',
    to: 'To',
    description: 'Description',
    booking_reference: 'Booking Ref',
    departure: 'Departure',
    destination: 'Destination',
    operator: 'Operator',
    passengers: 'Passengers',
};

let visibleColumns = {
    income: Object.keys(availableColumns),
    outcome: Object.keys(availableColumns),
};

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateDateFieldsVisibility();
});

function initializeEventListeners() {
    document.getElementById('reportForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('period').addEventListener('change', updateDateFieldsVisibility);
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('incomeSettingsBtn').addEventListener('click', () => openColumnSettings('income'));
    document.getElementById('outcomeSettingsBtn').addEventListener('click', () => openColumnSettings('outcome'));

    const modal = document.getElementById('columnSettingsModal');
    modal.querySelector('.close-btn').addEventListener('click', closeColumnSettings);
    modal.querySelector('.close-modal-btn').addEventListener('click', closeColumnSettings);
    modal.querySelector('.apply-columns-btn').addEventListener('click', applyColumnSettings);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeColumnSettings();
        }
    });
}

function updateDateFieldsVisibility() {
    const period = document.getElementById('period').value;
    const specificDateGroup = document.getElementById('specificDateGroup');
    const dateFromGroup = document.getElementById('dateFromGroup');
    const dateToGroup = document.getElementById('dateToGroup');

    if (period === 'custom') {
        specificDateGroup.classList.add('hidden');
        dateFromGroup.classList.remove('hidden');
        dateToGroup.classList.remove('hidden');
    } else {
        specificDateGroup.classList.remove('hidden');
        dateFromGroup.classList.add('hidden');
        dateToGroup.classList.add('hidden');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const params = new URLSearchParams();

    params.append('period', formData.get('period'));

    if (formData.get('module')) {
        params.append('module', formData.get('module'));
    }

    if (formData.get('agency')) {
        params.append('agency', formData.get('agency'));
    }

    if (formData.get('employee')) {
        params.append('employee', formData.get('employee'));
    }

    const period = formData.get('period');

    if (period === 'custom') {
        const dateFrom = formData.get('date_from');
        const dateTo = formData.get('date_to');

        if (!dateFrom || !dateTo) {
            alert('Please select both start and end dates for custom period');
            return;
        }

        params.append('date_from', dateFrom);
        params.append('date_to', dateTo);
    } else if (formData.get('specific_date')) {
        params.append('specific_date', formData.get('specific_date'));
    }

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/reports?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentReportData = data;

        displayReport(data);
        document.getElementById('exportPdfBtn').disabled = false;
    } catch (error) {
        console.error('Error fetching report:', error);
        alert('Failed to generate report. Please check your connection and try again.');
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
    document.getElementById('reportResults').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function displayReport(data) {
    const { period, module, dateRange, income, outcome } = data;

    document.getElementById('reportTitle').textContent = `${capitalizeFirst(period)} Report${module ? ` - ${capitalizeFirst(module)}` : ''}`;

    const dateFrom = new Date(dateRange.from).toLocaleDateString();
    const dateTo = new Date(dateRange.to).toLocaleDateString();
    document.getElementById('reportDateRange').textContent = `${dateFrom} - ${dateTo}`;

    renderTable('income', income.transactions, income.summary);
    renderTable('outcome', outcome.transactions, outcome.summary);

    document.getElementById('reportResults').classList.remove('hidden');
}

function renderTable(type, transactions, summary) {
    const headerRow = document.getElementById(`${type}TableHeader`);
    const tbody = document.getElementById(`${type}TableBody`);
    const tfoot = document.getElementById(`${type}TableFooter`);

    headerRow.innerHTML = '';
    tbody.innerHTML = '';
    tfoot.innerHTML = '';

    const columns = visibleColumns[type];

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = availableColumns[col];
        headerRow.appendChild(th);
    });

    if (transactions.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = columns.length;
        td.textContent = 'No transactions found';
        td.style.textAlign = 'center';
        td.style.padding = '2rem';
        td.style.color = 'var(--text-muted)';
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        transactions.forEach(transaction => {
            const tr = document.createElement('tr');

            columns.forEach(col => {
                const td = document.createElement('td');
                td.innerHTML = formatCellValue(col, transaction);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    }

    const summaryRow = document.createElement('tr');
    const summaryCell = document.createElement('td');
    summaryCell.colSpan = columns.length;

    if (summary.length === 0) {
        summaryCell.innerHTML = '<strong>Total:</strong> No transactions';
    } else {
        const summaryHTML = summary.map(s =>
            `<div style="display: inline-block; margin-right: 2rem;">
                <span class="currency-badge">${s.currency.toUpperCase()}</span>
                <strong style="margin-left: 0.5rem;">${s.total.toFixed(2)}</strong>
                <span style="color: var(--text-muted); margin-left: 0.5rem;">(${s.count} transactions)</span>
            </div>`
        ).join('');

        summaryCell.innerHTML = `<strong>Summary:</strong> ${summaryHTML}`;
    }

    summaryRow.appendChild(summaryCell);
    tfoot.appendChild(summaryRow);
}

function formatCellValue(column, transaction) {
    switch (column) {
        case 'amount':
            const amountClass = transaction.type === 'income' ? 'amount-positive' : 'amount-negative';
            return `<span class="${amountClass}">${transaction.amount?.toFixed(2) || 'N/A'}</span>`;

        case 'currency':
            return transaction.currency ? `<span class="currency-badge">${transaction.currency.toUpperCase()}</span>` : 'N/A';

        case 'createdAt':
            return transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A';

        case 'user':
            if (transaction.user) {
                const name = [transaction.user.first_name, transaction.user.last_name].filter(Boolean).join(' ');
                return name || transaction.user.email || 'N/A';
            }
            return 'N/A';

        case 'to':
            return transaction.to || 'N/A';

        case 'description':
            return transaction.description || 'N/A';

        case 'booking_reference':
            return transaction.ticket?.booking_reference || 'N/A';

        case 'departure':
            return transaction.ticket?.departure_location || 'N/A';

        case 'destination':
            return transaction.ticket?.destination_location || 'N/A';

        case 'operator':
            return transaction.ticket?.operator || 'N/A';

        case 'passengers':
            return transaction.ticket?.passengers?.length || '0';

        default:
            return 'N/A';
    }
}

function openColumnSettings(type) {
    currentTableType = type;
    const modal = document.getElementById('columnSettingsModal');
    const checkboxContainer = document.getElementById('columnCheckboxes');

    checkboxContainer.innerHTML = '';

    Object.entries(availableColumns).forEach(([key, label]) => {
        const checkboxWrapper = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = key;
        checkbox.checked = visibleColumns[type].includes(key);

        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(document.createTextNode(label));
        checkboxContainer.appendChild(checkboxWrapper);
    });

    modal.classList.remove('hidden');
}

function closeColumnSettings() {
    document.getElementById('columnSettingsModal').classList.add('hidden');
}

function applyColumnSettings() {
    const checkboxes = document.querySelectorAll('#columnCheckboxes input[type="checkbox"]');
    const selectedColumns = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    if (selectedColumns.length === 0) {
        alert('Please select at least one column');
        return;
    }

    visibleColumns[currentTableType] = selectedColumns;

    if (currentReportData) {
        const data = currentTableType === 'income' ? currentReportData.income : currentReportData.outcome;
        renderTable(currentTableType, data.transactions, data.summary);
    }

    closeColumnSettings();
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function exportToPDF() {
    if (!currentReportData) {
        alert('No report data to export');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const { period, module, dateRange, income, outcome } = currentReportData;

    doc.setFontSize(18);
    doc.text(`${capitalizeFirst(period)} Report${module ? ` - ${capitalizeFirst(module)}` : ''}`, 14, 20);

    doc.setFontSize(12);
    const dateFrom = new Date(dateRange.from).toLocaleDateString();
    const dateTo = new Date(dateRange.to).toLocaleDateString();
    doc.text(`Period: ${dateFrom} - ${dateTo}`, 14, 28);

    let yPosition = 40;

    doc.setFontSize(14);
    doc.text('Income Transactions', 14, yPosition);
    yPosition += 5;

    const incomeHeaders = visibleColumns.income.map(col => availableColumns[col]);
    const incomeRows = income.transactions.map(t =>
        visibleColumns.income.map(col => formatCellValueForPDF(col, t))
    );

    doc.autoTable({
        head: [incomeHeaders],
        body: incomeRows,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [99, 102, 241] },
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    if (income.summary.length > 0) {
        doc.setFontSize(10);
        const summaryText = income.summary.map(s =>
            `${s.currency.toUpperCase()}: ${s.total.toFixed(2)} (${s.count} transactions)`
        ).join(' | ');
        doc.text(`Summary: ${summaryText}`, 14, yPosition);
        yPosition += 15;
    }

    doc.setFontSize(14);
    doc.text('Outcome Transactions', 14, yPosition);
    yPosition += 5;

    const outcomeHeaders = visibleColumns.outcome.map(col => availableColumns[col]);
    const outcomeRows = outcome.transactions.map(t =>
        visibleColumns.outcome.map(col => formatCellValueForPDF(col, t))
    );

    doc.autoTable({
        head: [outcomeHeaders],
        body: outcomeRows,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [99, 102, 241] },
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    if (outcome.summary.length > 0) {
        doc.setFontSize(10);
        const summaryText = outcome.summary.map(s =>
            `${s.currency.toUpperCase()}: ${s.total.toFixed(2)} (${s.count} transactions)`
        ).join(' | ');
        doc.text(`Summary: ${summaryText}`, 14, yPosition);
    }

    const fileName = `report_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

function formatCellValueForPDF(column, transaction) {
    switch (column) {
        case 'amount':
            return transaction.amount?.toFixed(2) || 'N/A';

        case 'currency':
            return transaction.currency?.toUpperCase() || 'N/A';

        case 'createdAt':
            return transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A';

        case 'user':
            if (transaction.user) {
                const name = [transaction.user.first_name, transaction.user.last_name].filter(Boolean).join(' ');
                return name || transaction.user.email || 'N/A';
            }
            return 'N/A';

        case 'to':
            return transaction.to || 'N/A';

        case 'description':
            return transaction.description || 'N/A';

        case 'booking_reference':
            return transaction.ticket?.booking_reference || 'N/A';

        case 'departure':
            return transaction.ticket?.departure_location || 'N/A';

        case 'destination':
            return transaction.ticket?.destination_location || 'N/A';

        case 'operator':
            return transaction.ticket?.operator || 'N/A';

        case 'passengers':
            return transaction.ticket?.passengers?.length?.toString() || '0';

        default:
            return 'N/A';
    }
}
