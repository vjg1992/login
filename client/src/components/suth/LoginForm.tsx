// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  IconButton, 
  FormControlLabel, 
  Checkbox,
  Box,
  Typography,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import { Visibility, VisibilityOff, Google } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 400,
  margin: '0 auto',
  marginTop: theme.spacing(8),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
}));

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const LoginForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    emailOrMobile: '',
    password: '',
    rememberMe: false,
    otp: ''
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement login logic here
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <StyledPaper elevation={6}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Login to Logic-i
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Password" />
        <Tab label="Email OTP" />
        <Tab label="Mobile OTP" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Email or Mobile"
            variant="outlined"
            value={formData.emailOrMobile}
            onChange={(e) => setFormData({ ...formData, emailOrMobile: e.target.value })}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                color="primary"
              />
            }
            label="Remember me for 30 days"
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2, mb: 2 }}
          >
            Login
          </Button>
        </form>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Email OTP Form */}
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          variant="outlined"
        />
        <TextField
          fullWidth
          margin="normal"
          label="OTP"
          variant="outlined"
        />
        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Send OTP
        </Button>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Mobile OTP Form */}
        <TextField
          fullWidth
          margin="normal"
          label="Mobile Number"
          variant="outlined"
        />
        <TextField
          fullWidth
          margin="normal"
          label="OTP"
          variant="outlined"
        />
        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Send OTP
        </Button>
      </TabPanel>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<Google />}
        onClick={handleGoogleLogin}
        sx={{ mt: 2 }}
      >
        Continue with Google
      </Button>
    </StyledPaper>
  );
};