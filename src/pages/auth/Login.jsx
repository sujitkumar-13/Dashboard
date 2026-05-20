import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, ROLES } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: ROLES.CANDIDATE });
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      toast.error('Please fill in all fields');
      return;
    }

    // Mock Login / Signup
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      name: isLogin ? formData.email.split('@')[0] : formData.name, // Mock name if login
      email: formData.email,
      role: formData.role
    };

    login(user);
    toast.success('Successfully authenticated!');
    
    // Redirect based on role
    if (user.role === ROLES.CANDIDATE) navigate('/candidate/book');
    if (user.role === ROLES.INTERVIEWER) navigate('/interviewer/slots');
    if (user.role === ROLES.ADMIN) navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <Calendar className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:rounded-2xl sm:px-10 shadow-xl border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            )}
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg border bg-white shadow-sm transition-colors"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value={ROLES.CANDIDATE}>Candidate / Student</option>
                <option value={ROLES.INTERVIEWER}>Interviewer</option>
                <option value={ROLES.ADMIN}>Scheduler / Admin</option>
              </select>
            </div>

            <Button type="submit" className="w-full text-base py-2.5">
              {isLogin ? 'Sign in' : 'Sign up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
