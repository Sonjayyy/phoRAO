import { useEffect, useState } from 'react';
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';

// material-ui
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

// project import
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';

// assets
import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';

// Add useAuth import
import useAuth from 'hooks/useAuth';

// ==============================|| PROFILE - ACCOUNT ||============================== //

export default function RaoCo() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState(false);

  let selectedTab = 0;
  let breadcrumbTitle = 'Categories';
  let breadcrumbHeading = 'Categories';
  switch (pathname) {
    case '/apps/rao/co/categories':
      breadcrumbTitle = 'Categories';
      breadcrumbHeading = 'Categories';
      selectedTab = 0;
      break;
    case '/apps/rao/co/budget':
      breadcrumbTitle = 'Budget';
      breadcrumbHeading = 'Budget';
      selectedTab = 1;
      break;
    case '/apps/rao/co/expenses':
    default:
      breadcrumbTitle = 'Obligate Funds';
      breadcrumbHeading = 'Obligate Funds';
      selectedTab = 2;
  }

  const [value, setValue] = useState(selectedTab);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  let breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'CO', to: '/apps/rao/co/categories' },
    { title: breadcrumbTitle }
  ];
  if (selectedTab === 0) {
    breadcrumbLinks = [{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'CO' }];
  }

  useEffect(() => {
    if (pathname === '/apps/rao/co/categories') {
      setValue(0);
    }
  }, [pathname]);

  useEffect(() => {
    if (user?.role === 'guest') {
      setOpenModal(true);
    }
  }, [user]);

  const handleModalClose = () => {
    setOpenModal(false);
    navigate('/dashboard/default');
  };

  return (
    <>
      <Dialog
        open={openModal}
        onClose={handleModalClose}
        aria-labelledby="access-denied-dialog"
      >
        <DialogTitle id="access-denied-dialog">
          Access Denied
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sorry, this page is not accessible for guest users. You will be redirected to the dashboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {user?.role !== 'guest' && (
        <>
          <Breadcrumbs custom heading={breadcrumbHeading} links={breadcrumbLinks} />
          <MainCard border={false} boxShadow>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
              <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" aria-label="co tab">
                <Tab label="Categories Lists" component={Link} to="/apps/rao/co/categories" icon={<AppstoreOutlined />} iconPosition="start" />
                <Tab label="Budget" component={Link} to="/apps/rao/co/budget" icon={<AppstoreOutlined />} iconPosition="start" /> 
                <Tab label="Obligate Funds" component={Link} to="/apps/rao/co/expenses" icon={<AppstoreOutlined />} iconPosition="start" />
                <Tab label="Implement Funds (on-going development)" component={Link} to="" icon={<AppstoreOutlined />} iconPosition="start" />
                <Tab label="Disburse Funds (on-going development)" component={Link} to="" icon={<AppstoreOutlined />} iconPosition="start" />
              </Tabs>
            </Box>
            <Box sx={{ mt: 2.5 }}>
              <Outlet />
            </Box>
          </MainCard>
        </>
      )}
    </>
  );
}
