import { Box, Grid, CssBaseline, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import StatCard from '../components/common/StatCard';
import BookStatusTable from '../components/BookStatusTable';
import axios from 'axios';
import { useSelector } from 'react-redux';

const DashboardComp = () => {
  const [ownerId, setOwnerId] = useState(null);
  const [books, setBooks] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [previousMonthEarnings, setPreviousMonthEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useSelector((state) => state.user);

  const userId = currentUser?.user?.id;

  useEffect(() => {
    if (userId) {
      setOwnerId(userId);
      fetchBooksAndEarnings(userId);
    }
  }, [userId]);

  const fetchBooksAndEarnings = async (ownerId) => {
    try {
      const booksResponse = await axios.get(`https://book-rental-application.onrender.com/api/v1/book/owner/${ownerId}`, {
        headers: {
           Authorization: `Bearer ${localStorage.getItem('token')}`
        },
      });
      const booksData = booksResponse.data.books;

      setBooks(booksData);

      // Calculate total earnings
      const total = booksData.reduce((sum, book) => sum + (book.price || 0), 0);
      setTotalEarnings(total);

      // Calculate monthly and previous month's earnings
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const monthlyTotal = booksData.reduce((sum, book) => {
        const bookDate = new Date(book.createdAt);
        if (bookDate.getMonth() === currentMonth && bookDate.getFullYear() === currentYear) {
          return sum + (book.price || 0);
        }
        return sum;
      }, 0);

      const previousMonthlyTotal = booksData.reduce((sum, book) => {
        const bookDate = new Date(book.createdAt);
        if (bookDate.getMonth() === previousMonth && bookDate.getFullYear() === previousMonthYear) {
          return sum + (book.price || 0);
        }
        return sum;
      }, 0);

      setMonthlyEarnings(monthlyTotal);
      setPreviousMonthEarnings(previousMonthlyTotal);
      setLoading(false);
    } catch (err) {
      setError('Error fetching data'); // Set a user-friendly error message
      setLoading(false);
    }
  };

  const now = new Date();
  const options = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  };
  const formattedDate = now.toLocaleDateString('en-US', options);

  const changePercentage =
    previousMonthEarnings > 0
      ? ((monthlyEarnings - previousMonthEarnings) / previousMonthEarnings) * 100
      : 0;

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>; // Display error in red

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 4, background: '#F0F2FF' }}>
      <CssBaseline />
      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ mt: 4, mr: 2 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="This Month's Earnings"
                subtitle={`${formattedDate}`}
                value={`ETB ${monthlyEarnings.toFixed(2)}`}
                change={changePercentage.toFixed(2)}
                additionalInfo={`Compared to ETB ${previousMonthEarnings.toFixed(2)} last month.`}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={8}>
              <BookStatusTable books={books} />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardComp;
