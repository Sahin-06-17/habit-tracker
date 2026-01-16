// Helper to format a Date object to "YYYY-MM-DD" string
// This fixes timezone issues by ensuring we always talk in simple dates
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

const calculateStreak = (logs) => {
    if (!logs || logs.length === 0) {
        return { currentStreak: 0, completedToday: false, missedYesterday: false };
    }

    // 1. Sort logs newest to oldest
    const sortedLogs = logs.sort((a, b) => new Date(b.check_date) - new Date(a.check_date));

    // 2. Get Today and Yesterday as strings
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);

    // 3. Check status
    const latestLogDate = formatDate(new Date(sortedLogs[0].check_date));
    const completedToday = latestLogDate === todayStr;

    // 4. Calculate the Streak
    let streak = 0;
    
    // Determine where to start counting
    // If we did it today, start from today. If not, start looking from yesterday.
    let expectedDate = completedToday ? today : yesterday;

    for (let log of sortedLogs) {
        const logDateStr = formatDate(new Date(log.check_date));
        const expectedDateStr = formatDate(expectedDate);

        if (logDateStr === expectedDateStr) {
            streak++;
            // Move expected date back by one day
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            // Gap detected! Streak broken.
            break;
        }
    }

    // 5. Determine if we missed yesterday (for the "Repair Streak" button)
    // If we didn't do it today AND the streak is 0 (meaning we didn't do it yesterday either),
    // BUT we did it the day before yesterday? That logic is tricky. 
    // Simpler: If my last log was BEFORE yesterday, I missed yesterday.
    
    const missedYesterday = !completedToday && latestLogDate !== yesterdayStr;

    // Wait, the "Repair" button should only appear if the streak IS broken, 
    // but the last completion was the day BEFORE yesterday.
    // Actually, simpler UI logic: If I haven't done it today, check if I did it yesterday.
    // If I did NOT do it yesterday, the streak is technically 0, but I can repair it.
    
    return { currentStreak: streak, completedToday, missedYesterday };
};

module.exports = { calculateStreak, formatDate };