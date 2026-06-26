const form = document.getElementById('grade-form');
const modeInputs = document.querySelectorAll('input[name="education-mode"]');
const roundingInput = document.getElementById('consider-rounding');
const introText = document.getElementById('intro-text');
const fields = {
    main: document.getElementById('lblg1'),
    parallelRecovery: document.getElementById('lblr1'),
    second: document.getElementById('lblg2'),
    finalRecovery: document.getElementById('lblr2')
};
const ui = {
    firstLegend: document.getElementById('first-legend'),
    secondLegend: document.getElementById('second-legend'),
    mainLabel: document.getElementById('grade1-label'),
    parallelRecoveryLabel: document.getElementById('recovery1-label'),
    secondLabel: document.getElementById('grade2-label'),
    finalRecoveryLabel: document.getElementById('recovery2-label'),
    parallelRecoveryRow: document.getElementById('recovery1-row'),
    secondRow: document.getElementById('grade2-row'),
    roundingOption: document.getElementById('rounding-option')
};
const res = document.getElementById('res');

const APPROVAL_GRADE = 6;
const RAW_APPROVAL_BY_ROUNDING = 5.75;
const GRADUATION_VS_MINIMUM = 4;

function getMode() {
    const checked = document.querySelector('input[name="education-mode"]:checked');
    return checked ? checked.value : 'school';
}

function shouldConsiderSchoolRounding() {
    return getMode() === 'school' && roundingInput.checked;
}

function readGrade(input, label, required = false) {
    const rawValue = input.value.trim().replace(',', '.');

    if (!rawValue) {
        if (required) {
            throw new Error(`Informe a nota de ${label}.`);
        }

        return null;
    }

    const grade = Number(rawValue);

    if (!Number.isFinite(grade) || grade < 0 || grade > 10) {
        throw new Error(`${label} precisa ser uma nota entre 0 e 10.`);
    }

    return grade;
}

function parallelRecoveredMv1(mv1, mvrp) {
    if (mvrp === null || mv1 >= APPROVAL_GRADE) {
        return mv1;
    }

    return Math.max(mv1, (mv1 + 1.5 * mvrp) / 2.5);
}

function schoolRegularGrade(mv1, mv2) {
    return (mv1 + 2 * mv2) / 3;
}

function schoolFinalGrade(g2, mvr) {
    return (g2 + 1.5 * mvr) / 2.5;
}

function graduationFinalGrade(regularAverage, vs) {
    return (regularAverage + vs) / 2;
}

function schoolSigaaGrade(grade) {
    return Math.round(grade * 2) / 2;
}

function schoolApprovalTarget(considerRounding) {
    return considerRounding ? RAW_APPROVAL_BY_ROUNDING : APPROVAL_GRADE;
}

function schoolDisplayedFinalGrade(grade, considerRounding) {
    return considerRounding ? schoolSigaaGrade(grade) : grade;
}

function gradeNeededForMv2(mv1, considerRounding) {
    return (3 * schoolApprovalTarget(considerRounding) - mv1) / 2;
}

function schoolFinalRecoveryNeeded(g2, considerRounding) {
    return (2.5 * schoolApprovalTarget(considerRounding) - g2) / 1.5;
}

function graduationVsNeeded(regularAverage) {
    return 2 * APPROVAL_GRADE - regularAverage;
}

function formatGrade(value) {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
}

function formatExactGrade(value) {
    const roundedToOneDecimal = Number(value.toFixed(1));

    if (Math.abs(value - roundedToOneDecimal) < 0.0001) {
        return formatGrade(value);
    }

    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatNeededGrade(value) {
    const safeValue = Math.ceil((value - 0.0001) * 10) / 10;
    return formatGrade(safeValue);
}

function setResult(message, type = 'neutral') {
    res.className = `result result--${type}`;
    res.innerHTML = message;
}

function line(label, value) {
    return `<span>${label}</span><strong>${value}</strong>`;
}

function appendWarnings(warnings) {
    return warnings.map((warning) => `<small>${warning}</small>`).join('');
}

function buildSchoolWarnings(mv1, mvrp, mv2, mvr) {
    const warnings = [];

    if (mv1 >= APPROVAL_GRADE && mvrp !== null) {
        warnings.push('Rec. paralela ignorada: o G1 já é 6,0 ou mais.');
    }

    if (mv1 < APPROVAL_GRADE && mvrp !== null && (mv1 + 1.5 * mvrp) / 2.5 < mv1) {
        warnings.push('A rec. paralela não aumentou a nota, então ficou valendo o G1 original.');
    }

    if (mv2 === null && mvr !== null) {
        warnings.push('Informe o G2 para calcular com recuperação final.');
    }

    return warnings;
}

function calculateSchool() {
    const considerRounding = shouldConsiderSchoolRounding();
    const mv1 = readGrade(fields.main, 'MV1', true);
    const mvrp = readGrade(fields.parallelRecovery, 'recuperação paralela do MV1');
    const mv2 = readGrade(fields.second, 'MV2');
    const mvr = readGrade(fields.finalRecovery, 'recuperação final');
    const consideredMv1 = parallelRecoveredMv1(mv1, mvrp);
    const warnings = buildSchoolWarnings(mv1, mvrp, mv2, mvr);

    if (mv2 === null) {
        const neededMv2 = gradeNeededForMv2(consideredMv1, considerRounding);
        const message = neededMv2 > 10
            ? `Sua média do G1 ficou ${formatGrade(consideredMv1)}. Mesmo com 10,0 no G2, não fecha 6,0.`
            : `Sua média do G1 ficou ${formatGrade(consideredMv1)}. Você precisa tirar ${formatNeededGrade(Math.max(0, neededMv2))} no G2 para passar.`;

        setResult(`${message}${appendWarnings(warnings)}`, neededMv2 > 10 ? 'danger' : 'neutral');
        return;
    }

    const g2 = schoolRegularGrade(consideredMv1, mv2);
    const finalRegular = schoolDisplayedFinalGrade(g2, considerRounding);
    const regularLines = [
        line('Média calculada', formatExactGrade(g2)),
        line(considerRounding ? 'Média final no SIGAA' : 'Média final', considerRounding ? formatGrade(finalRegular) : formatExactGrade(finalRegular))
    ];

    if (finalRegular >= APPROVAL_GRADE) {
        setResult(`${regularLines.join('')}<p>Você passou, parabéns!</p>${appendWarnings(warnings)}`, 'success');
        return;
    }

    if (mvr === null) {
        const neededMvr = schoolFinalRecoveryNeeded(g2, considerRounding);
        const message = neededMvr > 10
            ? `${regularLines.join('')}<p>Mesmo com 10,0 na recuperação final, não fecha 6,0.</p>`
            : `${regularLines.join('')}<p>Você precisa tirar ${formatNeededGrade(Math.max(0, neededMvr))} na recuperação final para passar.</p>`;

        setResult(`${message}${appendWarnings(warnings)}`, neededMvr > 10 ? 'danger' : 'warning');
        return;
    }

    const gf = schoolFinalGrade(g2, mvr);
    const finalGradeValue = schoolDisplayedFinalGrade(gf, considerRounding);
    const finalLines = [
        line('Média calculada', formatExactGrade(gf)),
        line(considerRounding ? 'Média final no SIGAA' : 'Média final', formatExactGrade(finalGradeValue))
    ];

    if (finalGradeValue >= APPROVAL_GRADE) {
        setResult(`${finalLines.join('')}<p>Você passou, parabéns!</p>${appendWarnings(warnings)}`, 'success');
        return;
    }

    setResult(`${finalLines.join('')}<p>Você não passou. Boa sorte no próximo período!</p>${appendWarnings(warnings)}`, 'danger');
}

function calculateGraduation() {
    const regularAverage = readGrade(fields.main, 'média do período regular', true);
    const vs = readGrade(fields.finalRecovery, 'verificação suplementar');
    const regularLines = [
        line('Média final no SIGAA', formatGrade(regularAverage))
    ];

    if (regularAverage >= APPROVAL_GRADE) {
        setResult(`${regularLines.join('')}<p>Você passou, parabéns!</p>`, 'success');
        return;
    }

    if (regularAverage < GRADUATION_VS_MINIMUM) {
        setResult(`${regularLines.join('')}<p>Você não tem direito à VS.</p>`, 'danger');
        return;
    }

    if (vs === null) {
        const neededVs = graduationVsNeeded(regularAverage);
        const message = neededVs > 10
            ? `${regularLines.join('')}<p>Mesmo com 10,0 na VS, não fecha 6,0.</p>`
            : `${regularLines.join('')}<p>Você precisa tirar ${formatNeededGrade(Math.max(0, neededVs))} na VS para passar.</p>`;

        setResult(message, neededVs > 10 ? 'danger' : 'warning');
        return;
    }

    const mf = graduationFinalGrade(regularAverage, vs);
    const finalLines = [
        line('Média final no SIGAA', formatGrade(mf))
    ];

    if (mf >= APPROVAL_GRADE) {
        setResult(`${finalLines.join('')}<p>Você passou, parabéns!</p>`, 'success');
        return;
    }

    setResult(`${finalLines.join('')}<p>Você não passou. Boa sorte no próximo período!</p>`, 'danger');
}

function btnclick(event) {
    if (event) {
        event.preventDefault();
    }

    try {
        if (getMode() === 'graduation') {
            calculateGraduation();
            return;
        }

        calculateSchool();
    } catch (error) {
        setResult(error.message, 'danger');
    }
}

function setRowVisibility(row, visible) {
    row.classList.toggle('is-hidden', !visible);
}

function updateFormMode(clearResult = false) {
    const mode = getMode();
    const isGraduation = mode === 'graduation';

    introText.innerText = isGraduation
        ? 'Informe a média do período regular. Se ela ficar entre 4,0 e 5,9, preencha a Verificação Suplementar (VS). Na graduação, o SIGAA não arredonda a média final.'
        : 'Preencha as médias do G1 e G2. Por padrão, a calculadora mira 6,0 real para garantir aprovação.';

    ui.firstLegend.innerText = isGraduation ? 'Período regular' : 'Primeiro bimestre (G1)';
    ui.secondLegend.innerText = isGraduation ? 'Verificação suplementar' : 'Segundo bimestre (G2)';
    ui.mainLabel.innerText = isGraduation ? 'Média do período regular (M)' : 'Média';
    ui.parallelRecoveryLabel.innerText = 'Recuperação paralela do MV1 (MVRP)';
    ui.secondLabel.innerText = 'Média';
    ui.finalRecoveryLabel.innerText = isGraduation ? 'Verificação Suplementar (VS)' : 'Recuperação final (MVR)';
    fields.main.placeholder = '0,0 a 10,0';
    fields.finalRecovery.placeholder = isGraduation ? 'Se tiver VS' : 'Se precisar';
    setRowVisibility(ui.roundingOption, !isGraduation);
    setRowVisibility(ui.parallelRecoveryRow, !isGraduation);
    setRowVisibility(ui.secondRow, !isGraduation);

    if (isGraduation) {
        fields.parallelRecovery.value = '';
        fields.second.value = '';
        roundingInput.checked = false;
    }

    if (clearResult) {
        setResult('Informe suas notas para ver o resultado.', 'neutral');
    }
}

form.addEventListener('submit', btnclick);
modeInputs.forEach((input) => input.addEventListener('change', () => updateFormMode(true)));
roundingInput.addEventListener('change', () => setResult('Informe suas notas para ver o resultado.', 'neutral'));
updateFormMode();
