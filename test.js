const excelToJson = require('convert-excel-to-json');

var result = excelToJson({
    sourceFile: './resources/Test_Colors.xlsx'
});

console.log(result)