import { useState, useEffect, useMemo, useCallback } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';

import QUOTES from 'data/daily_qoute';

//import material ui components
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress, Collapse, Box, Stack, TextField, InputAdornment, Card, CardContent } from '@mui/material';

//import custom components
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import MonthlyBarChart from './MonthlyBarChart';
import ReportAreaChart from './ReportAreaChart';
import IncomeAreaChart from './IncomeAreaChart';
import MainCard from 'components/MainCard';

//import api mooe
import { getBudgetItems } from 'api/budget_items';
import { getExpensesItem } from 'api/expenses_item'; // Adjust the import path as necessary
//import api co
import { getBudgetItems as getBudgetItemsCo } from 'api/budget_items_co';
import { getExpensesItem as getExpensesItemCo } from 'api/expenses_item_co';
//import api ps
import { getBudgetItems as getBudgetItemsPs } from 'api/budget_items_ps';
import { getExpensesItem as getExpensesItemPs } from 'api/expenses_item_ps';


//import icons
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';

// auth
import useAuth from 'hooks/useAuth';
import { rgb } from '@react-spring/shared';

//format date
const formatDate = (dateString) => {
  if (!dateString) return 'No date';

  try {
    // First try parsing the date directly
    let date = new Date(dateString);

    // If invalid, try removing the 'T' and timezone part
    if (date.toString() === 'Invalid Date') {
      date = new Date(dateString.split('T')[0]);
    }

    // If still invalid, return the original string
    if (date.toString() === 'Invalid Date') {
      return dateString;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return dateString;
  }
};

// Add this new function for CSV date formatting
const formatDateForCSV = (dateString) => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    // Format as YYYY-MM-DD
    return date.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
  } catch (error) {
    console.error('Error formatting date for CSV:', dateString, error);
    return dateString;
  }
};

// Row component for collapsible functionality
function CategoryRow({ categoryId, amount, balanceInfo, expensesData, budgetItems }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        hover
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          '& > *': { borderBottom: 'unset' }
        }}
      >
        <TableCell>{categoryId}</TableCell>
        <TableCell align="right">
          {new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
          }).format(amount)}
        </TableCell>
        <TableCell align="right">
          {new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
          }).format(balanceInfo.expenses)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            color: balanceInfo.remaining < 0 ? 'error.main' : 'success.main'
          }}
        >
          {new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
          }).format(balanceInfo.remaining)}
        </TableCell>
        <TableCell align="right">
          {((balanceInfo.expenses / amount) * 100).toFixed(1)}%
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Expense Details
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Particulars</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expensesData
                    .filter(expense => {
                      const budget = budgetItems.find(b => b.id === expense.budget_id);
                      return budget && budget.category_name === categoryId;
                    })
                    .map((expense) => (
                      <TableRow key={expense.expenses_id}>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{expense.particulars}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP'
                          }).format(expense.amount)}
                        </TableCell>
                        <TableCell>{expense.remarks}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const gradientAnimation = keyframes`
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
`;

const StyledGreeting = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(90deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.secondary.main} 50%, 
    ${theme.palette.primary.main} 100%)`,
  backgroundSize: '200% auto',
  animation: `${gradientAnimation} 5s ease infinite`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textAlign: 'center',
  fontWeight: 700,
  letterSpacing: '0.5px',
  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
  marginBottom: theme.spacing(2),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60px',
    height: '3px',
    background: theme.palette.primary.main,
    borderRadius: '2px'
  }
}));

const Expenses = () => {
  // 1. All useState hooks
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [viewType, setViewType] = useState('MOOE');
  const [expandedRow, setExpandedRow] = useState(null);

  // 2. Auth hook
  const { user } = useAuth();

  // 3. All data fetching hooks - always fetch all data regardless of viewType
  const { expensesData = [], expensesLoading } = getExpensesItem();
  const { budgetItems = [] } = getBudgetItems();
  const { expensesDataCo = [], expensesLoadingCo } = getExpensesItemCo();
  const { budgetItemsCo = [] } = getBudgetItemsCo();
  const { expensesDataPs = [], expensesLoadingPs } = getExpensesItemPs();
  const { budgetItemsPs = [] } = getBudgetItemsPs();

  // 4. Memoize getCurrentData to prevent unnecessary recalculations
  const currentData = useMemo(() => {
    switch (viewType) {
      case 'CO':
        return {
          expensesData: expensesDataCo || [],
          budgetItems: budgetItemsCo || [],
          loading: expensesLoadingCo,
          title: 'CO Breakdown'
        };
      case 'PS':
        return {
          expensesData: expensesDataPs || [],
          budgetItems: budgetItemsPs || [],
          loading: expensesLoadingPs,
          title: 'PS Breakdown'
        };
      default:
        return {
          expensesData: expensesData || [],
          budgetItems: budgetItems || [],
          loading: expensesLoading,
          title: 'MOOE Breakdown'
        };
    }
  }, [
    viewType,
    expensesData, budgetItems, expensesLoading,
    expensesDataCo, budgetItemsCo, expensesLoadingCo,
    expensesDataPs, budgetItemsPs, expensesLoadingPs
  ]);

  // Move fetchQuote before useEffect
  const fetchQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);
  }, []);

  // 5. Single useEffect for initial data fetch
  useEffect(() => {
    if (currentData.expensesData) {
      setExpenses(currentData.expensesData);
      setLoading(false);
    }
  }, [currentData.expensesData]);

  useEffect(() => {
    fetchQuote();
  }, []);

  // Handlers
  const handleSearch = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleViewChange = useCallback((event) => {
    setViewType(event.target.value);
  }, []);

  const handleRowClick = useCallback((row) => {
    setExpandedRow(expandedRow?.id === row.id ? null : row);
  }, [expandedRow]);

  // Get current data values
  const { expensesData: currentExpensesData, budgetItems: currentBudgetItems } = currentData;

  // Calculate total budget and expenses
  const calculateTotalBudget = (budgetItems) => {
    if (!budgetItems || !Array.isArray(budgetItems)) return 0;
    return budgetItems
      .filter(item => item.year === currentYear)
      .reduce((total, item) => total + (parseFloat(item.budget) || 0), 0);
  };

  // With year filter
  const calculateTotalBudgetByYear = (budgetItems, year) => {
    return budgetItems
      .filter(item => item.year === year)
      .reduce((total, item) => total + parseFloat(item.budget), 0);
  };

  const calculateBudgetByCategory = (budgetItems, year) => {
    if (!budgetItems || !Array.isArray(budgetItems)) return {};

    return budgetItems
      .filter(item => item.year === year)
      .reduce((acc, item) => {
        const categoryName = item.category_name;
        if (!categoryName) return acc;

        acc[categoryName] = parseFloat(item.budget) || 0;
        return acc;
      }, {});
  };

  const calculateTotalExpenses = (budgetItems) => {
    if (!budgetItems || !Array.isArray(budgetItems)) return 0;
    return budgetItems
      .filter(item => item.year === currentYear)
      .reduce((total, item) => total + (parseFloat(item.total_expenses) || 0), 0);
  };

  // Calculate current year totals
  const currentYear = new Date().getFullYear();
  const calculateCurrentYearBudget = (budgetItems) => {
    return budgetItems
      .filter(item => item.year === currentYear)
      .reduce((total, item) => total + parseFloat(item.budget), 0);
  };

  const calculateCurrentYearExpenses = (expenses) => {
    return expenses
      .filter(expense => new Date(expense.date).getFullYear() === currentYear)
      .reduce((total, expense) => total + parseFloat(expense.amount), 0);
  };

  const calculateRemainingBalances = (budgetItems, expenses) => {
    const balances = {};

    if (!budgetItems || !expenses) return {};

    budgetItems.forEach(budget => {
      if (!budget?.category_name) return;

      // Get all expenses for this budget using budget.id
      const budgetExpenses = expenses.filter(expense =>
        expense?.budget_id === budget.id
      );

      // Calculate total expenses for this budget
      const totalExpenses = budgetExpenses.reduce((sum, expense) => {
        const amount = parseFloat(expense?.amount) || 0;
        return sum + amount;
      }, 0);

      // Use the correct properties from your data structure
      const budgetAmount = parseFloat(budget.budget) || 0;
      const remaining = parseFloat(budget.remaining_balance) || 0;

      // Store in object with category name as key
      balances[budget.category_name] = {
        budget: budgetAmount,
        expenses: parseFloat(budget.total_expenses) || 0,
        remaining: remaining
      };
    });

    return balances;
  };

  // Calculate percentages
  const totalBudget = calculateTotalBudget(currentData.budgetItems);
  const totalExpenses = calculateTotalExpenses(currentData.budgetItems);
  const currentYearBudget = calculateCurrentYearBudget(currentData.budgetItems);
  const currentYearExpenses = calculateCurrentYearExpenses(currentData.expensesData);
  const budgetUsagePercentage = (totalExpenses / totalBudget) * 100;
  const currentYearUsagePercentage = (currentYearExpenses / currentYearBudget) * 100;
  const remainingBalance = totalBudget - totalExpenses;

  // Calculate various metrics
  const categoryBreakdown = calculateBudgetByCategory(currentData.budgetItems, currentYear);

  const filteredCategories = Object.entries(categoryBreakdown).filter(([categoryId]) =>
    categoryId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      renderCell: (params) => (
        <div style={{ cursor: 'pointer', width: '100%' }} onClick={() => handleRowClick(params.row)}>
          {params.value || ''}
        </div>
      )
    },
    {
      field: 'budget',
      headerName: 'Budget',
      flex: 1,
      valueFormatter: (params) => new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(params || 0)
    },
    {
      field: 'expenses',
      headerName: 'Expenses',
      flex: 1,
      valueFormatter: (params) => new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(params || 0)
    },
    {
      field: 'remaining',
      headerName: 'Remaining',
      flex: 1,
      valueFormatter: (params) => new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(params || 0),
      cellClassName: (params) =>
        (params.value || 0) < 0 ? 'negative-balance' : 'positive-balance'
    },
    {
      field: 'usage',
      headerName: 'Usage %',
      flex: 1,
      valueFormatter: (params) => `${(params || 0).toFixed(1)}%`
    }
  ];

  // Convert your data to rows
  const rows = filteredCategories.map(([categoryId, amount], index) => {
    const budgetItem = currentBudgetItems.find(
      item => item.category_name === categoryId && item.year === currentYear
    );

    if (!budgetItem) {
      console.log('No budget item found for category:', categoryId);
      return {
        id: index,
        category: categoryId,
        budget: 0,
        expenses: 0,
        remaining: 0,
        usage: 0
      };
    }

    const budget = parseFloat(budgetItem.budget) || 0;
    const expenses = parseFloat(budgetItem.total_expenses) || 0;
    const remaining = parseFloat(budgetItem.remaining_balance) || 0;
    const usage = budget > 0 ? (expenses / budget) * 100 : 0;

    console.log('Row data:', {
      category: categoryId,
      budget,
      expenses,
      remaining,
      usage,
      rawBudgetItem: budgetItem
    });

    return {
      id: index,
      category: categoryId,
      budget,
      expenses,
      remaining,
      usage: Number.isFinite(usage) ? usage : 0
    };
  });

  const filteredRows = useMemo(() => {
    return rows.filter(row =>
      row.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rows, searchQuery]);

  const exportToCSV = () => {
    const categoryHeaders = ['Category', 'Budget', 'Expenses', 'Remaining', 'Usage %'];

    const csvRows = [];
    csvRows.push(categoryHeaders.join(','));

    filteredRows.forEach(row => {
      csvRows.push([
        `"${row.category}"`, // Wrap category in quotes to handle commas
        row.budget.toFixed(2),
        row.expenses.toFixed(2),
        row.remaining.toFixed(2),
        `${row.usage.toFixed(1)}%`
      ].join(','));

      csvRows.push('');
      csvRows.push(['Date', 'Particulars', 'Amount', 'Remarks'].join(','));

      const categoryExpenses = currentExpensesData
        .filter(expense => {
          const budget = currentBudgetItems.find(b => b.id === expense.budget_id);
          return budget && budget.category_name === row.category;
        })
        .map(expense => [
          formatDateForCSV(expense.date), // Use the new date formatter
          `"${(expense.particulars || '').replace(/"/g, '""')}"`, // Handle quotes in text
          parseFloat(expense.amount || 0).toFixed(2),
          `"${(expense.remarks || '').replace(/"/g, '""')}"` // Handle quotes in text
        ].join(','));

      csvRows.push(...categoryExpenses);
      csvRows.push('');
      csvRows.push('');
    });

    const csvContent = csvRows.join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentData.title}_${currentYear}_with_details.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  if (expensesLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <>
      {/* Daily Quote Card */}
      <MainCard sx={{ marginBottom: 2 }}>
        <Stack spacing={1} alignItems="center" sx={{ py: 2 }}>
          <StyledGreeting variant="h3">
            Hello {user.firstname} {user.lastname}!
          </StyledGreeting>
          <Typography
            variant="h6"
            color="textSecondary"
            sx={{
              mb: 2,
              fontWeight: 500,
              opacity: 0.9,
              textAlign: 'center'
            }}
          >
            Here's your daily quote:
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{
              fontStyle: 'italic',
              maxWidth: '80%'
            }}
          >
            "{quote.text}"
          </Typography>
          <Typography
            variant="subtitle2"
            color="textSecondary"
          >
            - {quote.author}
          </Typography>
        </Stack>
      </MainCard>
      {/* End of Daily Quote Card */}




      <MainCard sx={{ marginBottom: 2 }}>
        {/* View Type Selector */}
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 2 }}>
          <FormControl sx={{ minWidth: 900 }}>
            <InputLabel>Select Budget</InputLabel>

            <Select
              value={viewType}
              onChange={handleViewChange}
              label="View Type"
              size="medium"
              sx={{
                '& .MuiSelect-select': {
                  padding: '12px 16px', //padding of text
                  fontSize: '1rem',
                  textAlign: 'center'  // Center the selected text
                },
                '& .MuiSelect-icon': {
                  left: 18  // Adjust icon position if needed
                }
              }}
            >
              <MenuItem value="PS" sx={{ py: 1.5, justifyContent: 'center' }}>
                Personnel Services (PS)
              </MenuItem>
              <MenuItem value="MOOE" sx={{ py: 1.5, justifyContent: 'center' }}>
                Maintenance and Other Operating Expenses (MOOE)
              </MenuItem>
              <MenuItem value="CO" sx={{ py: 1.5, justifyContent: 'center' }}>
                Capital Outlay (CO)
              </MenuItem>
            </Select>
          </FormControl>
        </Box>



        <Stack direction="row" justifyContent="center" spacing={2} sx={{ marginBottom: 2 }}>
          {/* Recording of Expenses */}
          <AnalyticEcommerce
            title={`Total Budget  ${currentYear}`}
            count={new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(totalBudget)}
          />

          <AnalyticEcommerce
            title={`Total Obligated amount ${currentYear}`}
            count={new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(currentYearExpenses)}
          />

          <AnalyticEcommerce
            title={`Total Implemented Amount ${currentYear}`} 
          />

          <AnalyticEcommerce
            title={`Total Disbursed Amount ${currentYear}`}  
          />

          <AnalyticEcommerce
            title={`Savings ${currentYear}`}
            count={new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(remainingBalance)}
          />
        </Stack>
          {/* End of Recording of Expenses */}



        {/* Chart */}
        <MainCard sx={{ marginBottom: 2 }}>
          <IncomeAreaChart
            expensesData={currentExpensesData || []}
            budgetItems={currentBudgetItems || []}
            currentYear={currentYear}
          />
        </MainCard>
          {/*End of Chart */}



        {/* Category Breakdown Card */}
        <MainCard sx={{ marginBottom: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Typography variant="h6">
                {currentData.title} ({currentYear})
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
              <Button
                  startIcon={<DownloadOutlined />}
                  variant="contained" 
                  onClick={exportToCSV}
                  size="small"
                  sx={{
                    backgroundColor: 'green', // Change to your preferred color
                    '&:hover': {
                      transform: 'scale(1.1)', // Increase the size to 110% on hover
                      backgroundColor: 'green'
                    }
                  }}
                >
                  Export .CSV File
                </Button>

                <TextField
                  size="small"
                  placeholder="Search category..."
                  value={searchQuery}
                  onChange={handleSearch}
                  sx={{ width: '300px' }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined />
                      </InputAdornment>
                    )
                  }}
                />
              </Stack>
            </Stack>

            <Box sx={{ width: '100%' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align='center'>Category</TableCell>
                      <TableCell align="center">Budget</TableCell>
                      <TableCell align="center">Obligations</TableCell>
                      <TableCell align="center">Implemented</TableCell>
                      <TableCell align="center">Disbursed</TableCell>
                      <TableCell align="center">Usage %</TableCell>
                      <TableCell align="center">Savings</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredRows.map((row) => (
                      <React.Fragment key={row.id}>
                        <TableRow
                          hover
                          onClick={() => handleRowClick(row)}
                          sx={{
                            cursor: 'pointer',
                            '& > *': { borderBottom: 'unset' }
                          }}
                        >

                          <TableCell>{row.category}</TableCell> {/*dtoy t row ni category*/}

                          {/*ditoy ni Budget*/}
                          <TableCell align="center">
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP'
                            }).format(row.budget)}
                          </TableCell>

                           {/*ditoy ni Obligations*/}
                          <TableCell align="center">
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP'
                            }).format(row.expenses)}
                          </TableCell>


                          {/*ditoy ni Implemented*/}
                          <TableCell align="center">

                            
                          </TableCell>

                           {/*ditoy ni Disbursed*/}
                          <TableCell
                            align="center"
                            sx={{
                              color: row.remaining < 0 ? 'error.main' : 'success.main'
                            }}
                          >
                            {/*more code here*/}
                          </TableCell>

                           {/*ditoy ni Percentage*/}
                          <TableCell align="center">
                            {row.usage.toFixed(1)}%
                          </TableCell>

                           {/*ditoy ni Savings*/}
                             <TableCell
                            align="center"
                            sx={{
                              color: row.remaining < 0 ? 'error.main' : 'success.main'
                            }}
                          >
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP'
                            }).format(row.remaining)}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 0 }}>
                            <Collapse in={expandedRow?.id === row.id} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 3 }}>
                              <Typography 
                                variant="h6" 
                                gutterBottom 
                                sx={{
                                  backgroundColor: 'grey', // Add a background color
                                  padding: '1px 8px', // Add padding around the text
                                  borderRadius: '4px', // Optional: Add rounded corners
                                  color: 'Black' //text color
                                }}
                              >
                                Breakdown of expenses
                              </Typography>

                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Date</TableCell>
                                      <TableCell>Particulars</TableCell>
                                      <TableCell align="right">Amount Obligated</TableCell>
                                      <TableCell align="right">Amount Implemented</TableCell>
                                      <TableCell align="right">Amount Disbursed</TableCell>
                                      <TableCell>Remarks</TableCell>
                                    </TableRow>
                                  </TableHead>

                                  
                                  <TableBody>
                                    {currentExpensesData
                                      .filter(expense => {
                                        const budget = currentBudgetItems.find(b => b.id === expense.budget_id);
                                        return budget && budget.category_name === row.category;
                                      })
                                      .map((expense) => (
                                        <TableRow key={expense.expenses_id}>
                                          <TableCell align='left'>{formatDate(expense.date)}</TableCell>  {/*ditoy ni date*/}
                                          <TableCell>{expense.particulars}</TableCell>  {/*ditoy ni particulars*/}
                                          <TableCell align="right">  {/*ditoy ni obligated*/}
                                            {new Intl.NumberFormat('en-PH', {
                                              style: 'currency',
                                              currency: 'PHP'
                                            }).format(expense.amount)}
                                          </TableCell>
                                          <TableCell align="right">  {/*ditoy ni implemented*/}
                                            {new Intl.NumberFormat('en-PH', {
                                              style: 'currency',
                                              currency: 'PHP'
                                            }).format(expense.amount)}
                                          </TableCell>
                                          <TableCell align="right">  {/*ditoy ni disbursed*/}
                                            {new Intl.NumberFormat('en-PH', {
                                              style: 'currency',
                                              currency: 'PHP'
                                            }).format(expense.amount)}
                                          </TableCell>
                                          <TableCell>{expense.remarks}</TableCell>  {/*ditoy ni remarks*/}
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </MainCard>
      </MainCard>
    </>
  );
};

CategoryRow.propTypes = {
  categoryId: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  balanceInfo: PropTypes.shape({
    budget: PropTypes.number,
    expenses: PropTypes.number,
    remaining: PropTypes.number
  }).isRequired,
  expensesData: PropTypes.array.isRequired,
  budgetItems: PropTypes.array.isRequired
};

export default Expenses;