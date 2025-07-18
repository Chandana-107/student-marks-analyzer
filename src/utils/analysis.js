export function calculateTotal(students) {
    return students.reduce((sum, student) => sum + student.marks, 0);
}
export function calculateAverage(students) {
    if (students.length === 0) return 0;
    const total = calculateTotal(students);
    return (total / students.length).toFixed(2);
}
export function findTopper(students) {
    return students.reduce((top, student) => student.marks > top.marks ? student : top, students[0]);
}
export function getPassFailList(students) {
    return students.map(student => ({
        name: student.name,
        marks: student.marks,
        status: student.marks >= 35 ? 'Pass' : 'Fail',
        className: student.marks >= 35 ? 'pass' : 'fail'
    }));
}
export function analyze(students) {
  const marksArr = students.map(s => s.marks);
  const average = marksArr.reduce((a, b) => a + b, 0) / marksArr.length;
  const highest = students.reduce((a, b) => (a.marks > b.marks ? a : b));
  const lowest = students.reduce((a, b) => (a.marks < b.marks ? a : b));
  const passed = students.filter(s => s.marks >= 40).length;
  const failed = students.length - passed;
  return { average, highest, lowest, passed, failed };
}
