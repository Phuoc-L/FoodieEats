const calculateAverageRating = (menu) => {
  let totalRatingSum = 0;
  let totalRatingCount = 0;

  menu.forEach((item) => {
    totalRatingSum += item.average_rating * item.num_ratings;
    totalRatingCount += item.num_ratings;
  });

  return totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 0;
};

module.exports = calculateAverageRating;
