const expenseColors = {
    rent: {
        background: "rgba(234, 179, 8, 0.5)", // yellow-500 với độ trong suốt
        border: "rgb(234, 179, 8)", // yellow-500
    },
    electricity: {
        background: "rgba(16, 185, 129, 0.5)", // green-500 với độ trong suốt
        border: "rgb(16, 185, 129)", // green-500
    },
    water: {
        background: "rgba(14, 165, 233, 0.5)", // sky-500 với độ trong suốt
        border: "rgb(14, 165, 233)", // sky-500
    },
};

// Thêm các hàm này vào đầu file
function showLoading() {
    $("#loadingOverlay").removeClass("hidden").addClass("flex");
}

function hideLoading() {
    $("#loadingOverlay").removeClass("flex").addClass("hidden");
}

// Hiển thị loading ngay khi script được tải
showLoading();

// Thêm đoạn code này vào đầu file script.js
function initDarkMode() {
    const $html = $("html");
    const $darkModeToggle = $("#darkModeToggle");
    const $transition = $("#darkModeTransition");

    // Kiểm tra trạng thái Dark Mode từ localStorage
    if (localStorage.getItem("darkMode") === "true") {
        $html.addClass("dark");
    }

    updateChartColors();

    $darkModeToggle.on("click", function (event) {
        const isDark = $html.hasClass("dark");
        const maxDim = Math.max(window.innerWidth, window.innerHeight);

        $transition.removeClass("hidden").css({
            "clip-path": `circle(0% at ${event.clientX}px ${event.clientY}px)`,
        });

        // Trigger reflow
        $transition[0].offsetHeight;

        setTimeout(() => {
            $transition.css({
                "clip-path": `circle(${maxDim}px at ${event.clientX}px ${event.clientY}px)`,
                transition: "clip-path 1s linear",
            });
        }, 50);

        setTimeout(() => {
            $html.toggleClass("dark");
            localStorage.setItem("darkMode", $html.hasClass("dark"));
            updateChartColors();
        }, 500);

        setTimeout(() => {
            $transition
                .css({
                    "clip-path": "circle(0% at 50% 50%)",
                    transition: "none",
                })
                .addClass("hidden");
        }, 1000);
    });
}

// Cập nhật màu sắc cho biểu đồ khi chuyển đổi Dark Mode
function updateChartColors() {
    const colors = getChartColors(getCurrentTheme());

    $.each(Chart.instances, function (index, chart) {
        chart.options.scales.x.ticks.color = colors.text;
        chart.options.scales.y.ticks.color = colors.text;
        chart.options.scales.x.grid.color = colors.grid;
        chart.options.scales.y.grid.color = colors.grid;
        chart.options.plugins.legend.labels.color = colors.text;
        chart.update();
    });
}

// Cập nhật hàm commonOptions
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
            ticks: {
                maxRotation: 45,
                minRotation: 45,
                color: function () {
                    return getChartColors(getCurrentTheme()).text;
                },
            },
            grid: {
                color: function () {
                    return getChartColors(getCurrentTheme()).grid;
                },
            },
        },
        y: {
            beginAtZero: true,
            ticks: {
                callback: function (value, index, values) {
                    return formatCurrency(value);
                },
                color: function () {
                    return getChartColors(getCurrentTheme()).text;
                },
            },
            grid: {
                color: function () {
                    return getChartColors(getCurrentTheme()).grid;
                },
            },
        },
    },
    plugins: {
        legend: {
            position: "top",
            labels: {
                color: function () {
                    return getChartColors(getCurrentTheme()).text;
                },
            },
        },
        tooltip: {
            callbacks: {
                label: function (context) {
                    let label = context.dataset.label || "";
                    if (label) {
                        label += ": ";
                    }
                    if (context.parsed.y !== null) {
                        label += formatCurrency(context.parsed.y);
                    }
                    return label;
                },
            },
        },
    },
};

$(document).ready(function () {
    // Đọc dữ liệu từ file JSON
    $.getJSON("./assets/data.json", function (data) {
        const expenses = data.expenses;
        updateDateRange(expenses);

        // Kiểm tra dữ liệu mới và hiển thị thông báo nếu cần
        checkForNewData(expenses);

        // Tạo mảng các tháng và dữ liệu chi tiêu
        const months = expenses.map((item) => item.date);
        const rentData = expenses.map((item) => item.rent);
        const electricityData = expenses.map((item) => item.electricity);
        const waterData = expenses.map((item) => item.water);

        // Tính tổng chi phí hàng tháng
        const totalExpenses = expenses.map((item) => item.rent + item.electricity + item.water);

        updateUI(data);
        bindTableData(data.expenses);

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                    },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value, index, values) {
                            return formatCurrency(value);
                        },
                    },
                },
            },
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || "";
                            if (label) {
                                label += ": ";
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        },
                    },
                },
            },
        };

        // Biểu đồ đường
        const ctxLine = $("#expenseLineChart")[0].getContext("2d");
        new Chart(ctxLine, {
            type: "line",
            data: {
                labels: months,
                datasets: [
                    {
                        label: "Tiền trọ",
                        data: rentData,
                        borderColor: expenseColors.rent.border,
                        backgroundColor: expenseColors.rent.background,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: false,
                    },
                    {
                        label: "Tiền điện",
                        data: electricityData,
                        borderColor: expenseColors.electricity.border,
                        backgroundColor: expenseColors.electricity.background,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: false,
                    },
                    {
                        label: "Tiền nước",
                        data: waterData,
                        borderColor: expenseColors.water.border,
                        backgroundColor: expenseColors.water.background,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: false,
                    },
                ],
            },
            options: commonOptions,
        });

        // Tạo biểu đồ đường cho chi phí trọ
        const rentCtx = document.getElementById("rentLineChart").getContext("2d");
        new Chart(rentCtx, {
            type: "line",
            data: {
                labels: months,
                datasets: [
                    {
                        label: "Tiền trọ",
                        data: rentData,
                        borderColor: expenseColors.rent.border,
                        backgroundColor: expenseColors.rent.background,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: false,
                    },
                ],
            },
            options: commonOptions,
        });

        // Tạo biểu đồ cột cho chi phí điện/nước
        const electricityWaterCtx = document.getElementById("electricityBarChart").getContext("2d");
        new Chart(electricityWaterCtx, {
            type: "line",
            data: {
                labels: months,
                datasets: [
                    {
                        label: "Tiền điện",
                        data: electricityData,
                        borderColor: expenseColors.electricity.border,
                        backgroundColor: expenseColors.electricity.background,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: false,
                    },
                ],
            },
            options: commonOptions,
        });

        // Tạo biểu đồ cột cho chi phí điện/nước
        const waterCtx = document.getElementById("waterBarChart").getContext("2d");
        new Chart(waterCtx, {
            type: "line",
            data: {
                labels: months,
                datasets: [
                    {
                        label: "Tiền nước",
                        data: waterData,
                        borderColor: expenseColors.water.border,
                        backgroundColor: expenseColors.water.background,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: false,
                    },
                ],
            },
            options: commonOptions,
        });

        // Biểu đồ cột
        const ctxBar = $("#expenseBarChart")[0].getContext("2d");
        new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: months,
                datasets: [
                    {
                        label: "Tiền trọ",
                        data: rentData,
                        backgroundColor: expenseColors.rent.background,
                        borderColor: expenseColors.rent.border,
                        borderWidth: 1,
                    },
                    {
                        label: "Tiền điện",
                        data: electricityData,
                        backgroundColor: expenseColors.electricity.background,
                        borderColor: expenseColors.electricity.border,
                        borderWidth: 1,
                    },
                    {
                        label: "Tiền nước",
                        data: waterData,
                        backgroundColor: expenseColors.water.background,
                        borderColor: expenseColors.water.border,
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    x: {
                        ...commonOptions.scales.x,
                        stacked: true,
                    },
                    y: {
                        ...commonOptions.scales.y,
                        stacked: true,
                    },
                },
            },
        });
    })
        .fail(function (jqxhr, textStatus, error) {
            console.error("Không thể đọc dữ liệu: " + textStatus + ", " + error);
        })
        .always(function () {
            hideLoading();
            initDarkMode();
        });

    // Hàm định dạng tiền tệ
    function formatCurrency(value) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(value);
    }

    function getSavingTip(avgExpenses, maxExpenses) {
        const difference = maxExpenses - avgExpenses;
        const percentage = (difference / avgExpenses) * 100;
        if (percentage > 20) {
            return `Bạn có thể tiết kiệm đến ${formatCurrency(
                difference
            )} mỗi tháng bằng cách giảm chi phí xuống mức trung bình.`;
        } else if (percentage > 10) {
            return `Cố gắng giảm chi phí xuống gần mức trung bnh để tiết kiệm ${formatCurrency(
                difference
            )} mỗi tháng.`;
        } else {
            return "Chi tiêu của bạn khá ổn định. Hãy duy trì thói quen tốt này!";
        }
    }

    function updateSavingTip(avgExpenses, maxExpenses) {
        const tip = getSavingTip(avgExpenses, maxExpenses);
        $("#savingTip").text(tip);
        $("#fullSavingTip").text(tip);
    }

    function animateValue(id, value) {
        const element = document.getElementById(id);
        const od = new Odometer({
            el: element,
            value: 0,
            format: "(,ddd).dd",
            duration: 150,
        });
        od.update(value);
    }

    function updateUI(data) {
        const expenses = data.expenses;
        const totalRent = expenses.reduce((sum, month) => sum + month.rent, 0);
        const totalElectricity = expenses.reduce((sum, month) => sum + month.electricity, 0);
        const totalWater = expenses.reduce((sum, month) => sum + month.water, 0);
        const totalExpenses = totalRent + totalElectricity + totalWater;
        const avgExpenses = Math.round(totalExpenses / expenses.length);
        const minExpenses = Math.min(
            ...expenses.map((month) => month.rent + month.electricity + month.water)
        );
        const maxExpenses = Math.max(
            ...expenses.map((month) => month.rent + month.electricity + month.water)
        );

        animateValue("totalRent", totalRent);
        animateValue("totalElectricity", totalElectricity);
        animateValue("totalWater", totalWater);
        animateValue("totalExpenses", totalExpenses);
        animateValue("avgExpenses", avgExpenses);
        animateValue("minExpenses", minExpenses);
        animateValue("maxExpenses", maxExpenses);

        updateSavingTip(avgExpenses, maxExpenses);
    }

    function updateDateRange(expenses) {
        const dates = expenses.map((item) => moment(item.date, "MM/YYYY"));
        const minDate = moment.min(dates);
        const maxDate = moment.max(dates);
        $("#startDate").text(minDate.format("MM/YYYY"));
        $("#endDate").text(maxDate.format("MM/YYYY"));
    }

    function exportToExcel() {
        // Lấy giá tr ngày bắt đu và kết thúc từ trang web sử dụng jQuery
        const startDate = $("#startDate").text();
        const endDate = $("#endDate").text();

        // Đọc dữ liệu từ file JSON
        $.getJSON("./assets/data.json", function (data) {
            const expenses = data.expenses;

            // Tạo một workbook mới
            const wb = XLSX.utils.book_new();

            // Tạo dữ liệu cho worksheet
            const wsData = [
                [`Chi tiêu từ ${startDate} đến ${endDate}`],
                [],
                ["Tháng", "Tiền trọ", "Tiền điện", "Tiền nước", "Tổng chi phí"],
            ];

            // Thêm dữ liệu từ expenses vào wsData
            expenses.forEach((item) => {
                wsData.push([
                    item.date,
                    item.rent,
                    item.electricity,
                    item.water,
                    { f: `SUM(B${wsData.length + 1}:D${wsData.length + 1})` },
                ]);
            });

            // Tạo worksheet
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Định dạng tiêu đề
            ws["A1"].s = {
                font: { bold: true, sz: 16 },
                alignment: { horizontal: "center" },
            };
            ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]; // Gộp các ô cho tiêu đề

            // Định dạng tiêu đề cột và thêm border
            const range = XLSX.utils.decode_range(ws["!ref"]);
            for (let C = 0; C <= range.e.c; ++C) {
                for (let R = 0; R <= range.e.r; ++R) {
                    const cell = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cell]) ws[cell] = {};
                    if (!ws[cell].s) ws[cell].s = {};

                    // Thêm border cho tất cả các ô
                    ws[cell].s.border = {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } },
                    };

                    // Định dạng tiêu đề cột
                    if (R === 2) {
                        ws[cell].s.font = { bold: true };
                        ws[cell].s.fill = { fgColor: { rgb: "FFFF00" } }; // Màu nền vàng
                        ws[cell].s.alignment = { horizontal: "center" };
                    }

                    // Định dạng số tiền cho các cột từ B đến E, bắt đầu từ hàng 4
                    if (C >= 1 && C <= 4 && R >= 3) {
                        ws[cell].z = "#,##0";
                    }
                }
            }

            // Tự đng điều chỉnh độ rng cột
            const colWidths = wsData.map((row) =>
                row.map((cell) => (cell ? cell.toString().length : 10))
            );
            const maxColWidths = colWidths.reduce(
                (acc, row) => row.map((col, i) => Math.max(acc[i] || 0, col)),
                []
            );
            ws["!cols"] = maxColWidths.map((width) => ({ width: Math.min(width + 2, 30) }));

            // Thêm worksheet vào workbook
            XLSX.utils.book_append_sheet(wb, ws, "Monthly Expenses");

            // Tạo timestamp cho tên file
            const timestamp = moment().format("YYYYMMDDHHmmss");
            const fileName = `monthly_expenses_${timestamp}.xlsx`;

            // Xuất file Excel
            XLSX.writeFile(wb, fileName);
        }).fail(function (jqxhr, textStatus, error) {
            console.error("Không thể đọc dữ liệu: " + textStatus + ", " + error);
        });
    }

    // Thêm event listener cho nút xuất Excel sử dụng jQuery
    $("#exportExcel").on("click", exportToExcel);

    // Trong phần $(document).ready(), sau khi tạo tất cả các biểu đồ, thêm dòng này:
    updateChartColors();

    // Thêm các hàm mới sau đây

    // Hàm kiểm tra dữ liu mới
    function checkForNewData(expenses) {
        // Lấy dữ liệu đã thông báo cuối cùng từ localStorage
        const lastNotifiedData = JSON.parse(localStorage.getItem("lastNotifiedData") || "[]");

        // Tìm các bản ghi mới
        const newRecords = expenses.filter(
            (expense) =>
                !lastNotifiedData.some(
                    (oldExpense) =>
                        oldExpense.date === expense.date &&
                        oldExpense.rent === expense.rent &&
                        oldExpense.electricity === expense.electricity &&
                        oldExpense.water === expense.water
                )
        );

        if (newRecords.length > 0) {
            // Sắp xếp các bản ghi mới theo ngày
            newRecords.sort(
                (a, b) => moment(b.date, "MM/YYYY").valueOf() - moment(a.date, "MM/YYYY").valueOf()
            );

            // Lấy bản ghi mới nhất
            const latestNewRecord = newRecords[0];

            // Tính tổng chi tiêu cho bản ghi mới nhất
            const totalExpenses =
                latestNewRecord.rent + latestNewRecord.electricity + latestNewRecord.water;

            showBrowserNotification(latestNewRecord, newRecords.length, totalExpenses);
        }
        // Lưu dữ liệu hiện tại vào localStorage sau khi đã thông báo
        localStorage.setItem("lastNotifiedData", JSON.stringify(expenses));
    }

    // Hàm hiển thị thông báo trên trình duyệt
    function showBrowserNotification(latestMonth, newRecordsCount, totalExpense) {
        if (!("Notification" in window)) {
            console.log("Trình duyệt này không hỗ trợ thông báo trên desktop");
            return;
        }

        if (Notification.permission === "granted") {
            createNotification(latestMonth, newRecordsCount, totalExpense);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    createNotification(latestMonth, newRecordsCount, totalExpense);
                }
            });
        }
    }

    // Hàm tạo thông báo
    function createNotification(latestRecord, newRecordsCount, totalExpense) {
        // Sử dụng Moment.js để parse và format ngày tháng
        const date = moment(latestRecord.date, "MM/YYYY", true);

        if (!date.isValid()) {
            console.error("Invalid date format:", latestRecord.date);
            return; // Thoát khỏi hàm nếu ngày không hợp lệ
        }

        // Đặt locale cho tiếng Việt
        moment.locale("vi");

        const formattedMonth = date.format("MM/YYYY"); // Ví dụ: "11/2024"

        const formattedExpense = new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(totalExpense);

        const notificationTitle = `Cập nhật chi tiêu ${formattedMonth}`;
        const notificationBody = `Tổng chi phí mới cho ${formattedMonth} đã được cập nhật: ${formattedExpense}.`;

        const notificationOptions = {
            body: notificationBody,
            icon: "/path/to/your/icon.png", // Thay đổi đường dẫn này theo icon của bạn
        };

        new Notification(notificationTitle, notificationOptions);
    }

    let globalExpenses = [];

    $(document).ready(function () {
        fetchData();
        showTipPopup(); // Hiển thị popup khi trang được tải

        // Xử lý nút "Tip mới"
        $("#newTipBtn").click(function () {
            const $icon = $(this).find("i");
            $icon.addClass("spin-animation");
            displayFinancialTip();
            setTimeout(() => {
                $icon.removeClass("spin-animation");
            }, 1000);
        });

        // Xử lý nút đóng tip
        $("#closeTipBtn").click(function () {
            $("#tipContainer").fadeOut(300, function () {
                $(this).remove();
            });
        });

        // Đóng popup khi nhấn nút "Đã hiểu" hoặc icon đóng
        $("#closeTipBtn, #closeTipIcon").click(function () {
            $("#tipPopup").addClass("hidden");
        });

        // Đóng popup khi nhấn bên ngoài
        $("#tipPopup").click(function (event) {
            if (event.target.id === "tipPopup") {
                $("#tipPopup").addClass("hidden");
            }
        });
    });

    function fetchData() {
        $.getJSON("./assets/data.json", function (data) {
            globalExpenses = data.expenses;
            displayFinancialTip(); // Hiển thị tip sau khi có dữ liệu
            // ... (code xử lý dữ liệu khác)
        });
    }

    function showTipPopup() {
        // Kiểm tra xem đã hiển thị tip trong ngày hôm nay chưa
        const lastTipDate = localStorage.getItem("lastTipDate");
        const today = new Date().toDateString();

        if (lastTipDate === today) {
            console.log("Đã hiển thị tip trong ngày hôm nay. Bỏ qua.");
            return;
        }

        const tip = getRandomTip();
        $("#tipPopupContent").text(tip);
        $("#tipPopup").removeClass("hidden");

        // Lưu ngày hiển thị tip
        localStorage.setItem("lastTipDate", today);
    }

    function displayFinancialTip() {
        if (globalExpenses && globalExpenses.length > 0) {
            const lastMonth = globalExpenses[globalExpenses.length - 1];
            const totalExpense = lastMonth.rent + lastMonth.electricity + lastMonth.water;
            const avgExpense = calculateAverageExpense();

            const tipFunctions = [
                {
                    func: getOverallTip,
                    args: [totalExpense, avgExpense],
                    title: "Tổng quan chi tiêu",
                },
                {
                    func: getRentTip,
                    args: [lastMonth.rent, totalExpense],
                    title: "Về chi phí thuê nhà",
                },
                {
                    func: getUtilityTip,
                    args: [lastMonth.electricity, lastMonth.water],
                    title: "Về tiền điện nước",
                },
            ];

            if (lastMonth.income) {
                tipFunctions.push({
                    func: getSavingsTip,
                    args: [lastMonth.income, totalExpense],
                    title: "Về tiết kiệm",
                });
            }

            // Lọc bỏ các tip rỗng
            const validTips = tipFunctions.filter((tip) => tip.func(...tip.args) !== "");

            if (validTips.length > 0) {
                // Chọn ngẫu nhiên một tip
                const chosenTip = validTips[Math.floor(Math.random() * validTips.length)];
                const tipContent = chosenTip.func(...chosenTip.args);

                // Cập nhật nội dung và tiêu đề
                $("#financialTipTitle").text(chosenTip.title);
                $("#financialTip").text(tipContent).hide().fadeIn(1000);
            } else {
                $("#financialTipTitle").text("Lời khuyên tài chính");
                $("#financialTip").text(getRandomTip()).hide().fadeIn(1000);
            }
        } else {
            $("#financialTipTitle").text("Lời khuyên tài chính");
            $("#financialTip").text(getRandomTip()).hide().fadeIn(1000);
        }
    }

    function calculateAverageExpense() {
        return (
            globalExpenses.reduce((sum, exp) => sum + exp.rent + exp.electricity + exp.water, 0) /
            globalExpenses.length
        );
    }

    function getOverallTip(totalExpense, avgExpense) {
        const tips = [
            {
                condition: totalExpense > avgExpense * 1.2,
                messages: [
                    "Có vẻ như chi tiêu tháng này của bạn hơi cao đấy. Hãy xem xét lại các khoản chi nhé!",
                    "Tháng này bạn chi tiêu nhiều hơn bình thường rồi. Có lẽ nên cân nhắc tiết kiệm hơn đấy.",
                    "Chi tiêu tăng vọt! Đây có thể là lúc để xem lại ngân sách của bạn đấy.",
                ],
            },
            {
                condition: totalExpense < avgExpense * 0.8,
                messages: [
                    "Tuyệt vời! Bạn đã tiết kiệm được kha khá trong tháng này. Hãy tiếp tục phát huy nhé!",
                    "Thật ấn tượng! Chi tiêu thấp hơn hẳn. Bạn đang làm rất tốt trong việc quản lý tài chính đấy.",
                    "Xuất sắc! Bạn đã kiểm soát chi tiêu rất tốt tháng này. Hãy duy trì phong độ này nhé!",
                ],
            },
            {
                condition: true,
                messages: [
                    "Chi tiêu của bạn khá ổn định. Hãy tiếp tục theo dõi và cải thiện nhé!",
                    "Tháng này bạn chi tiêu khá cân đối. Hãy duy trì thói quen tốt này nhé!",
                    "Bạn đang giữ mức chi tiêu ổn định. Đó là một dấu hiệu tốt đấy!",
                ],
            },
        ];

        const applicableTip = tips.find((tip) => tip.condition);
        return applicableTip.messages[Math.floor(Math.random() * applicableTip.messages.length)];
    }

    function getRentTip(rent, totalExpense) {
        if (rent > totalExpense * 0.5) {
            const tips = [
                "Tiền nhà chiếm hơn nửa chi tiêu của bạn rồi. Có lẽ nên cân nhắc tìm một nơi ở phù hợp hơn với túi tiền?",
                "Chi phí thuê nhà đang chiếm phần lớn ngân sách của bạn. Đã đến lúc xem xét các lựa chọn nhà ở khác rồi đấy.",
                "Chà, tiền nhà cao quá! Bạn có thể tiết kiệm được nhiều hơn nếu tìm được một chỗ ở hợp lý hơn đấy.",
            ];
            return tips[Math.floor(Math.random() * tips.length)];
        }
        return "";
    }

    function getUtilityTip(electricity, water) {
        const avgElectricity =
            globalExpenses.reduce((sum, exp) => sum + exp.electricity, 0) / globalExpenses.length;
        const avgWater =
            globalExpenses.reduce((sum, exp) => sum + exp.water, 0) / globalExpenses.length;

        const tips = [];
        if (electricity > avgElectricity * 1.2) {
            tips.push(
                "Hóa đơn tiền điện tháng này cao hơn bình thường. Có lẽ đã đến lúc đầu tư vào các thiết bị tiết kiệm điện rồi!",
                "Tiền điện tăng vọt! Hãy thử tắt những thiết bị không cần thiết khi không sử dụng nhé.",
                "Chi phí điện cao hơn thường lệ. Bạn đã thử dùng bóng đèn LED tiết kiệm chưa?"
            );
        }
        if (water > avgWater * 1.2) {
            tips.push(
                "Tiền nước tháng này hơi cao. Hãy kiểm tra xem có vòi nước nào bị rò rỉ không nhé!",
                "Hóa đơn tiền nước tăng kìa. Có lẽ bạn nên xem xét cách sử dụng nước hiệu quả hơn đấy.",
                "Chi phí nước cao hơn bình thường. Bạn đã thử dùng các thiết bị tiết kiệm nước chưa?"
            );
        }
        return tips.length > 0 ? tips[Math.floor(Math.random() * tips.length)] : "";
    }

    function getSavingsTip(income, totalExpense) {
        const savingsRate = (income - totalExpense) / income;
        if (savingsRate < 0.1) {
            const tips = [
                "Bạn đang tiết kiệm khá ít đấy. Hãy thử để dành ít nhất 10% thu nhập mỗi tháng nhé!",
                "Tỷ lệ tiết kiệm của bạn hơi thấp. Đã đến lúc lập kế hoạch tiết kiệm rồi đấy!",
                "Có vẻ như bạn đang chi tiêu gần hết thu nhập. Hãy thử tiết kiệm nhiều hơn một chút nhé!",
            ];
            return tips[Math.floor(Math.random() * tips.length)];
        } else if (savingsRate > 0.2) {
            const tips = [
                "Tuyệt vời! Bạn đang tiết kiệm rất tốt. Hãy nghĩ đến việc đầu tư số tiền dư thừa nhé!",
                "Thật ấn tượng! Tỷ lệ tiết kiệm của bạn rất cao. Đã bao giờ bạn nghĩ đến việc đầu tư chưa?",
                "Bạn đang tiết kiệm rất giỏi! Đây có thể là thời điểm tốt để tìm hiểu về các cơ hội đầu tư đấy.",
            ];
            return tips[Math.floor(Math.random() * tips.length)];
        }
        return "";
    }

    function getRandomTip() {
        return financialTips[Math.floor(Math.random() * financialTips.length)];
    }

    const financialTips = [
        "Hãy đặt mục tiêu tiết kiệm 20% thu nhập mỗi tháng.",
        "Theo dõi chi tiêu hàng ngày để hiểu rõ thói quen tài chính của bạn.",
        "Tạo quỹ khẩn cấp đủ để trang trải 3-6 tháng chi phí sinh hoạt.",
        "Đầu tư vào bản thân thông qua học tập và phát triển kỹ năng.",
        "Cân nhắc các khoản đầu tư dài hạn như chứng khoán hoặc quỹ đầu tư.",
        "Giảm chi phí không cần thiết bằng cách lập kế hoạch mua sắm trước.",
        "Sử dụng quy tắc 50/30/20: 50% cho nhu cầu, 30% cho mong muốn, 20% để tiết kiệm.",
        "Tránh nợ tín dụng với lãi suất cao.",
        "Tự nấu ăn tại nhà thay vì ăn ngoài để tiết kiệm chi phí.",
        "Xem xét các gói bảo hiểm để bảo vệ tài chính trong trường hợp khẩn cấp.",
        "Tạo nhiều nguồn thu nhập để đa dạng hóa tài chính của bạn.",
        "Sử dụng các ứng dụng quản lý tài chính để theo dõi chi tiêu và ngân sách.",
        "Đặt các mục tiêu tài chính ngắn hạn và dài hạn, và lập kế hoạch để đạt được chúng.",
        "Tìm hiểu về các chiến lược đầu tư khác nhau để tối ưu hóa lợi nhuận.",
        "Xem xét việc tái cấu trúc các khoản nợ để giảm lãi suất và thời gian trả nợ.",
        "Tận dụng các chương trình khuyến mãi và hoàn tiền khi mua sắm.",
        "Đầu tư vào các quỹ chỉ số với chi phí thấp để đa dạng hóa danh mục đầu tư.",
        "Tạo thói quen tiết kiệm tự động bằng cách thiết lập chuyển khoản định kỳ vào tài khoản tiết kiệm.",
        "Học cách đàm phán để cải thiện thu nhập và giảm chi phí.",
        "Xem xét việc mua bảo hiểm nhân thọ để bảo vệ người thân trong trường hợp không may.",
        "Tìm hiểu về các ưu đãi thuế và tận dụng chúng để tối ưu hóa tài chính.",
        "Đầu tư vào bất động sản có thể là một cách tốt để tạo thu nhập thụ động.",
        "Tránh mua sắm dựa trên cảm xúc, hãy đợi ít nhất 24 giờ trước khi mua các món đồ lớn.",
        "Tạo một kế hoạch trả nợ và tuân thủ nó một cách nghiêm túc.",
        "Xem xét việc thuê thay vì mua đối với các thiết bị đắt tiền mà bạn không thường xuyên sử dụng.",
        "Học cách sửa chữa và bảo trì cơ bản để tiết kiệm chi phí sửa chữa.",
        "Tận dụng các chương trình giảm giá và mua hàng theo mùa để tiết kiệm.",
        "Đầu tư vào giáo dục tài chính để nâng cao kiến thức và kỹ năng quản lý tiền bạc.",
        "Xem xét việc làm thêm công việc phụ để tăng thu nhập.",
        "Tạo một quỹ 'vui chơi' riêng để tránh chi tiêu quá mức cho giải trí.",
    ];

    function bindTableData(data) {
        const table = $("#summary-table");
        data.forEach(function (item, index) {
            table.find(
                "tbody"
            ).append(`<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <th scope="row" class="border px-6 py-4 text-center font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            ${item.date}
                        </th>
                        <td class="border px-6 py-4 text-right">
                            ${formatCurrency(item.rent)}
                        </td>
                        <td class="border px-6 py-4 text-right">
                            ${formatCurrency(item.electricity)}
                        </td>
                        <td class="border px-6 py-4 text-right">
                            ${formatCurrency(item.water)}
                        </td>
                        <td class="border px-6 py-4 text-right">
                            ${formatCurrency(item.rent + item.electricity + item.water)}
                        </td>
                    </tr>`);
        });
        table.find(
            "tfoot"
        ).html(`<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <th scope="row" class="border px-6 py-4 font-semibold text-gray-900 whitespace-nowrap dark:text-white">
                        Tổng cộng
                    </th>
                    <td class="border px-6 py-4 text-right">
                        ${formatCurrency(data.reduce((sum, item) => sum + (item.rent || 0), 0))}
                    </td>
                    <td class="border px-6 py-4 text-right">
                        ${formatCurrency(
                            data.reduce((sum, item) => sum + (item.electricity || 0), 0)
                        )}
                    </td>
                    <td class="border px-6 py-4 text-right">
                        ${formatCurrency(data.reduce((sum, item) => sum + (item.water || 0), 0))}
                    </td>
                    <td class="border px-6 py-4 text-right">
                        ${formatCurrency(
                            data.reduce(
                                (sum, item) =>
                                    sum + (item.rent + item.electricity + item.water || 0),
                                0
                            )
                        )}
                    </td>
                </tr>`);
    }
});

// Thêm hàm này vào đầu file hoặc trong phần khai báo hàm
function getCurrentTheme() {
    return $("html").hasClass("dark") ? "dark" : "light";
}

function getChartColors(theme) {
    return theme === "dark"
        ? { text: "#D1D5DB", grid: "#4B5563" }
        : { text: "#374151", grid: "#E5E7EB" };
}
