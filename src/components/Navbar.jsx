import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
  // { name: 'Home', href: '/' },
  { name: 'Find Rides', href: '/rides' },
  { name: 'Offer Ride', href: '/rides/create' },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Get navigation items based on authentication status
  const getNavItems = () => {
    const items = [...navigation];
    
    // Add authenticated user links
    if (isAuthenticated) {
      items.push({ name: 'My Rides', href: '/my-rides' });
      items.push({ name: 'My Requests', href: '/ride-requests' });
    }
    
    return items;
  };

  return (
    <Disclosure as="nav" className="bg-white shadow sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <Link to="/" className="flex flex-shrink-0 items-center">
                  <span className="text-2xl font-bold text-primary">GoTogether</span>
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {getNavItems().map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                        isActive(item.href)
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {isAuthenticated ? (
                  <Menu as="div" className="relative ml-3">
                    <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                        {user.firstName?.[0] || user.name?.[0] || 'U'}
                      </div>
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={`block px-4 py-2 text-sm ${
                                active ? 'bg-gray-100' : ''
                              } text-gray-700`}
                            >
                              Your Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/ride-requests"
                              className={`block px-4 py-2 text-sm ${
                                active ? 'bg-gray-100' : ''
                              } text-gray-700`}
                            >
                              My Ride Requests
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/my-rides"
                              className={`block px-4 py-2 text-sm ${
                                active ? 'bg-gray-100' : ''
                              } text-gray-700`}
                            >
                              My Offered Rides
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={logout}
                              className={`block w-full px-4 py-2 text-left text-sm ${
                                active ? 'bg-gray-100' : ''
                              } text-gray-700`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      to="/login"
                      className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-primary text-white hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {getNavItems().map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={`block py-2 pl-3 pr-4 text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            {!isAuthenticated && (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="flex items-center justify-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-500 hover:text-gray-700 px-4 py-2 text-base font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md text-base font-medium"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
            {isAuthenticated && (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                      {user.firstName?.[0] || user.name?.[0] || 'U'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.name || user.email}
                    </div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Disclosure.Button
                    as={Link}
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Your Profile
                  </Disclosure.Button>
                  <Disclosure.Button
                    as="button"
                    onClick={logout}
                    className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Sign out
                  </Disclosure.Button>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
} 