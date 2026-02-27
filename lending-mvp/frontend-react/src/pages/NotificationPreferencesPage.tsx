import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent as CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  lastNotificationTime?: string;
  emailNotifications: string[];
  smsNotifications: string[];
  pushNotifications: string[];
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    lastNotificationTime: new Date().toISOString(),
    emailNotifications: ['Loan Approval', 'Payment Reminder', 'Account Update'],
    smsNotifications: ['Transaction Alert', 'Payment Due', 'Security Notification'],
    pushNotifications: ['All Notifications', 'Loan Updates', 'Payment Reminders'],
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/v1/teller/notification-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  const handleToggle = (type: 'email' | 'sms' | 'push') => {
    setPreferences((prev) => ({
      ...prev,
      [`${type}Enabled`]: !prev[`${type}Enabled` as keyof NotificationPreferences],
    }));
  };

  const handleSavePreferences = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/v1/teller/notification-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_enabled: preferences.emailEnabled,
          sms_enabled: preferences.smsEnabled,
          push_enabled: preferences.pushEnabled,
          email_notifications: preferences.emailNotifications,
          sms_notifications: preferences.smsNotifications,
          push_notifications: preferences.pushNotifications,
        }),
      });

      if (response.ok) {
        setNotification({ message: 'Notification preferences saved successfully!', type: 'success' });
      } else {
        const errorData = await response.json();
        setNotification({ message: errorData.detail || 'Failed to save preferences', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotificationType = (category: string, item: string) => {
    setPreferences((prev) => {
      const currentItems = prev[`${category}Notifications` as keyof NotificationPreferences] as string[];
      const updatedItems = currentItems.includes(item)
        ? currentItems.filter((i) => i !== item)
        : [...currentItems, item];

      return {
        ...prev,
        [`${category}Notifications`]: updatedItems,
      };
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl mb-4 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Notification Preferences
              </h2>
              <p className="text-lg text-blue-100 mt-1">
                Configure how you receive notifications
              </p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-white hover:text-blue-100 hover:bg-white/10">
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          {notification && (
            <Alert
              variant={notification.type === 'success' ? 'default' : 'destructive'}
              className="mb-6"
            >
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <h3 className="text-xl font-semibold tracking-tight text-gray-700 mb-4">
              Notification Channels
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={`border ${preferences.emailEnabled ? 'border-blue-300' : 'border-gray-300'}`}>
                <CardBody>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${preferences.emailEnabled ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center`}>
                        <svg className={`w-6 h-6 ${preferences.emailEnabled ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className={`text-base font-semibold ${preferences.emailEnabled ? 'text-blue-600' : 'text-gray-600'}`}>
                          Email Notifications
                        </h4>
                        <p className="text-sm font-medium leading-none text-gray-500 mt-1">
                          {preferences.emailEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={preferences.emailEnabled}
                      onCheckedChange={() => handleToggle('email')}
                    />
                  </div>
                </CardBody>
              </Card>

              <Card className={`border ${preferences.smsEnabled ? 'border-green-300' : 'border-gray-300'}`}>
                <CardBody>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${preferences.smsEnabled ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                        <svg className={`w-6 h-6 ${preferences.smsEnabled ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className={`text-base font-semibold ${preferences.smsEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                          SMS Notifications
                        </h4>
                        <p className="text-sm font-medium leading-none text-gray-500 mt-1">
                          {preferences.smsEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={preferences.smsEnabled}
                      onCheckedChange={() => handleToggle('sms')}
                    />
                  </div>
                </CardBody>
              </Card>

              <Card className={`border ${preferences.pushEnabled ? 'border-purple-300' : 'border-gray-300'}`}>
                <CardBody>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${preferences.pushEnabled ? 'bg-purple-100' : 'bg-gray-100'} flex items-center justify-center`}>
                        <svg className={`w-6 h-6 ${preferences.pushEnabled ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div>
                        <h4 className={`text-base font-semibold ${preferences.pushEnabled ? 'text-purple-600' : 'text-gray-600'}`}>
                          Push Notifications
                        </h4>
                        <p className="text-sm font-medium leading-none text-gray-500 mt-1">
                          {preferences.pushEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={preferences.pushEnabled}
                      onCheckedChange={() => handleToggle('push')}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold tracking-tight text-gray-700 mb-4">
              Notification Types
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium leading-none text-gray-600 mb-2 block">
                  Email Notifications
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Loan Approval', 'Payment Reminder', 'Account Update', 'Statement Ready', 'Promotional Offers'].map((item) => (
                    <Badge
                      key={item}
                      variant={preferences.emailNotifications.includes(item) ? 'default' : 'outline'}
                      onClick={() => toggleNotificationType('email', item)}
                      className="cursor-pointer"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium leading-none text-gray-600 mb-2 block">
                  SMS Notifications
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Transaction Alert', 'Payment Due', 'Security Notification', 'Cash Drawer Reconciliation', 'Loan Repayment'].map((item) => (
                    <Badge
                      key={item}
                      variant={preferences.smsNotifications.includes(item) ? 'default' : 'outline'}
                      onClick={() => toggleNotificationType('sms', item)}
                      className="cursor-pointer bg-green-500 hover:bg-green-600"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium leading-none text-gray-600 mb-2 block">
                  Push Notifications
                </span>
                <div className="flex flex-wrap gap-2">
                  {['All Notifications', 'Loan Updates', 'Payment Reminders', 'Account Changes', 'Security Alerts'].map((item) => (
                    <Badge
                      key={item}
                      variant={preferences.pushNotifications.includes(item) ? 'default' : 'outline'}
                      onClick={() => toggleNotificationType('push', item)}
                      className="cursor-pointer bg-purple-500 hover:bg-purple-600"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {preferences.lastNotificationTime && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="text-sm font-medium leading-none text-gray-600">
                    Last Notification Sent:
                  </span>
                  <span className="text-sm font-semibold leading-none text-blue-600 ml-2">
                    {new Date(preferences.lastNotificationTime).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-between items-center mt-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button onClick={handleSavePreferences} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}