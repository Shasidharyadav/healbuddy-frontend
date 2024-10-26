import React, { useState } from 'react';
import api from '../../../../api';
import * as XLSX from 'xlsx';
import './style/CalculateScoreButton.css';

const CalculateScoreButton = ({ profileId }) => {
    const [diagnosisData, setDiagnosisData] = useState(null);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [error, setError] = useState(null);

    const fetchProfileData = async (profileId) => {
        try {
            const response = await api.get(`/api/profiles/${profileId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching profile data:', error);
            throw error;
        }
    };

    const insertProfileDataIntoSheet = (sheet, profileData, bmi) => {
        const { name, age, gender } = profileData;
        sheet['B2'] = { v: name };
        sheet['B3'] = { v: age };
        sheet['B4'] = { v: gender };
        sheet['B5'] = { v: bmi };
    };

    const mapAnswersToSheet = (sheet, answers, startColumn) => {
        Object.keys(answers).forEach(key => {
            const row = findRowByQuestionCode(sheet, key);
            if (row !== null) {
                const answer = answers[key];
                if (Array.isArray(answer)) {
                    answer.forEach((value, index) => {
                        const column = XLSX.utils.encode_col(XLSX.utils.decode_col(startColumn) + index);
                        sheet[`${column}${row}`] = { v: value };
                    });
                } else {
                    sheet[`${startColumn}${row}`] = { v: answer };
                }
            }
        });
    };

    const findRowByQuestionCode = (sheet, code) => {
        const range = XLSX.utils.decode_range(sheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            const cell = sheet[XLSX.utils.encode_cell({ r: R, c: 0 })];
            if (cell && cell.v === code) {
                return R + 1;
            }
        }
        return null;
    };

    const extractColumnsBCD = (sheet) => {
        if (!sheet['!ref']) {
            console.error('Sheet reference range is missing or incorrect.');
            return [];
        }

        const range = XLSX.utils.decode_range(sheet['!ref']);
        const extractedData = [];

        for (let R = range.s.r; R <= range.e.r; ++R) {
            const rowData = [];
            ['B', 'C', 'D'].forEach((col) => {
                const cell = sheet[`${col}${R + 1}`];
                rowData.push(cell ? cell.v : '');
            });
            extractedData.push(rowData);
        }

        return extractedData;
    };

    const sendExtractedDataToBackend = async (data) => {
        try {
            const formattedData = formatExtractedData(data);
            const requestData = {
                profileId: profileId,
                diagnosisData: formattedData
            };

            const response = await api.post('/api/diagnosis/save', requestData);
            setSubmissionSuccess(true);
        } catch (error) {
            setError(error.message || error);
        }
    };

    const saveUpdatedWorkbook = async (workbook) => {
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const formData = new FormData();
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        formData.append('file', blob, 'Updated_LotusAlgorithmSimulator.xlsx');
        formData.append('profileId', profileId);

        try {
            const response = await api.post('/api/files/saveWorkbook', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.filePath;
        } catch (error) {
            throw error;
        }
    };

    const reloadWorkbookForRecalculation = async (filePath) => {
        const response = await api.get(`/api/files/downloadWorkbook`, {
            params: { filePath },
            responseType: 'arraybuffer'
        });

        const workbook = XLSX.read(response.data, { type: 'array' });
        const recalculatedSheet = workbook.Sheets['Provisional Diagnosis'];

        if (!recalculatedSheet) {
            throw new Error('Provisional Diagnosis sheet is missing after recalculation.');
        }

        return extractColumnsBCD(recalculatedSheet);
    };

    const calculateScore = async () => {
        try {
            const profileData = await fetchProfileData(profileId);
            const response = await api.get(`/api/assessment-summary/${profileId}/answers`);

            if (response.status === 404) {
                return;
            }

            const data = response.data;
            const bmi = data.levelOneAnswers.BMI || 0;

            const fileResponse = await fetch('/Excel/Lotus Algorithm Simulator_18092024.xlsx');
            if (!fileResponse.ok) {
                throw new Error('Failed to fetch Excel file.');
            }

            const arrayBuffer = await fileResponse.arrayBuffer();
            let workbook = XLSX.read(arrayBuffer, { type: 'array' });

            const diagnosisSheet = workbook.Sheets['Provisional Diagnosis'];
            if (!diagnosisSheet) {
                throw new Error('Provisional Diagnosis sheet not found.');
            }

            insertProfileDataIntoSheet(diagnosisSheet, profileData, bmi);

            const responseSheet = workbook.Sheets['Response'];
            if (!responseSheet) {
                throw new Error('Response sheet not found.');
            }
            clearColumn(responseSheet, 'D');
            mapAnswersToSheet(responseSheet, data.levelOneAnswers, 'D');
            mapAnswersToSheet(responseSheet, data.levelTwoAnswers, 'D');

            const savedFilePath = await saveUpdatedWorkbook(workbook);

            const extractedData = await reloadWorkbookForRecalculation(savedFilePath);

            await sendExtractedDataToBackend(extractedData);

            await deleteSavedFile(savedFilePath);

        } catch (error) {
            setError(error.message || error);
        }
    };

    return (
        <div className="calculate-score-container">
            <button onClick={calculateScore} className="calculate-button">
                Calculate Score and Extract Data
            </button>
            {diagnosisData && (
                <div className="diagnosis-data">
                    <h3>Extracted Provisional Diagnosis Data (Columns B, C, D):</h3>
                    <table className="diagnosis-table">
                        <tbody>
                            {diagnosisData.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {submissionSuccess && <p className="success-message">Data successfully submitted to the backend!</p>}
            {error && <p className="error-message">Error: {error}</p>}
        </div>
    );
};

export default CalculateScoreButton;
