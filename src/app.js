import { analyze } from './utils/analysis.js';

const STORAGE_KEY = 'marks_analyzer_students';
let students = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let chartInstance = null;
let chartSortBy = null;

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

window.addStudent = function() {
  const nameInput = document.getElementById('name');
  const marksInput = document.getElementById('marks');
  const name = nameInput.value.trim();
  const marks = Number(marksInput.value);
  if (!name || isNaN(marks) || marks < 0) {
    alert('Please enter a valid name and marks.');
    return;
  }
  students.push({ name, marks });
  nameInput.value = '';
  marksInput.value = '';
  saveStudents();
  renderStudentList();
  document.getElementById('results').innerHTML = '';
};

window.analyzeMarks = function() {
  if (students.length === 0) {
    alert('Add at least one student.');
    return;
  }
  const result = analyze(students);
  const passPercent = ((result.passed / students.length) * 100).toFixed(1);
  document.getElementById('results').innerHTML = `
    <h3>Analysis</h3>
    <p><strong>Total Students:</strong> ${students.length}</p>
    <p><strong>Average Marks:</strong> ${result.average.toFixed(2)}</p>
    <p><strong>Highest Marks:</strong> ${result.highest.name} (${result.highest.marks})</p>
    <p><strong>Lowest Marks:</strong> ${result.lowest.name} (${result.lowest.marks})</p>
    <p><strong>Passed:</strong> ${result.passed} / ${students.length} (${passPercent}%)</p>
    <p><strong>Failed:</strong> ${result.failed} / ${students.length}</p>
  `;
};

window.removeStudent = function(index) {
  students.splice(index, 1);
  saveStudents();
  renderStudentList();
  document.getElementById('results').innerHTML = '';
};

window.exportCSV = function() {
  if (students.length === 0) {
    alert('No data to export!');
    return;
  }
  const header = "Name,Marks,Status\n";
  const rows = students.map(s => `${s.name},${s.marks},${s.marks >= 40 ? 'Pass' : 'Fail'}`).join("\n");
  const csvContent = header + rows;
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student_marks.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n');
    for (let line of lines) {
      const [name, marks] = line.split(',');
      if (name && marks && !isNaN(Number(marks))) {
        students.push({ name: name.trim(), marks: Number(marks) });
      }
    }
    saveStudents && saveStudents();
    renderStudentList && renderStudentList();
  };
  reader.readAsText(file);
}
window.importCSV = importCSV;

function getColorArray(length) {
  const palette = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(0, 200, 83, 0.7)',
    'rgba(233, 30, 99, 0.7)',
    'rgba(255, 87, 34, 0.7)',
    'rgba(63, 81, 181, 0.7)'];
  return Array.from({length}, (_, i) => palette[i % palette.length]);
}

function renderChart(filteredStudents = students) {
  const ctx = document.getElementById('marksChart').getContext('2d');
  const names = filteredStudents.map(s => s.name);
  const marks = filteredStudents.map(s => s.marks);
  const chartType = document.getElementById('chartType').value;
  const colors = getColorArray(filteredStudents.length);
  if (chartInstance) {
    chartInstance.destroy();
  }
  let data, options, type;
  if (chartType === 'pie') {
    type = 'pie';
    data = {
      labels: names,
      datasets: [{
        label: 'Marks',
        data: marks,
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 2 }]
    };
    options = {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'bottom' },
        title: { display: true, text: 'Student Marks Pie Chart' }
      }
    };
  } else if (chartType === 'line') {
    type = 'line';
    data = {
      labels: names,
      datasets: [{
        label: 'Marks',
        data: marks,
        backgroundColor: colors[0],
        borderColor: colors[0],
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        pointRadius: 5}]
    };
    options = {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: 'Student Marks Line Chart' }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    };
  } else {
    type = 'bar';
    data = {
      labels: names,
      datasets: [{
        label: 'Marks',
        data: marks,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.7', '1')),
        borderWidth: 2,
        borderRadius: 8}]
    };
    options = {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Student Marks Bar Chart' }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    };
  }
  chartInstance = new Chart(ctx, {
    type,
    data,
    options });
}

window.sortChart = function(by) {
  chartSortBy = by;
  updateChart();
};

function getFilteredStudents() {
  const filter = document.getElementById('chartFilter').value;
  let filtered = students.slice();
  if (filter === 'top10') {
    filtered = filtered.sort((a, b) => b.marks - a.marks).slice(0, 10);
  } else if (filter === 'pass') {
    filtered = filtered.filter(s => s.marks >= 40);
  } else if (filter === 'fail') {
    filtered = filtered.filter(s => s.marks < 40);
  }
  if (chartSortBy === 'name') {
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (chartSortBy === 'marks') {
    filtered = filtered.sort((a, b) => b.marks - a.marks);
  }
  return filtered;
}

function updateChart() {
  renderChart(getFilteredStudents());
}

document.getElementById('chartType').addEventListener('change', updateChart);
document.getElementById('chartFilter').addEventListener('change', updateChart);

function renderStudentList() {
  const listDiv = document.getElementById('student-list');
  if (students.length === 0) {
    listDiv.innerHTML = '<em>No students added yet.</em>';
    updateChart();
    return;
  }
  listDiv.innerHTML = students.map(
    (s, i) => {
      const status = s.marks >= 40 ? '<span class="pass">Pass</span>' : '<span class="fail">Fail</span>';
      return `<div class="student-entry">${i+1}. ${s.name} - ${s.marks} ${status} <button onclick="removeStudent(${i})">Remove</button></div>`;
    }
  ).join('');
  updateChart();
}
renderStudentList();

window.clearAll = function() {
  if (confirm("Are you sure you want to clear all data?")) {
    students = [];
    saveStudents();
    renderStudentList();
    document.getElementById('results').innerHTML = '';
  }
};

window.downloadChart = function() {
  const chart = document.getElementById('marksChart');
  const link = document.createElement('a');
  link.href = chart.toDataURL('image/png');
  link.download = 'student_marks_chart.png';
  link.click();
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('importCSV').addEventListener('change', importCSV);
});
