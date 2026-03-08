import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, providerAPI, vetAPI, shelterAPI } from '@/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [provider, setProvider] = useState(null);
  const [vetClinic, setVetClinic] = useState(null);
  const [shelter, setShelter] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('paw_token');
    const savedUser = localStorage.getItem('paw_user');
    if (!token || !savedUser) {
      setLoading(false);
      return;
    }
    try {
      setUser(JSON.parse(savedUser));
      const { data } = await authAPI.me();
      setUser(data);

      // Load product profile based on product_type
      const productType = data.product_type || localStorage.getItem('paw_product');

      if (productType === 'vet_clinic') {
        try {
          const { data: clinic } = await vetAPI.getClinic();
          setVetClinic(clinic);
          setActiveProduct('vet_clinic');
          localStorage.setItem('paw_product', 'vet_clinic');
        } catch { /* No vet clinic yet */ }
      } else if (productType === 'shelter') {
        try {
          const { data: sh } = await shelterAPI.getProfile();
          setShelter(sh);
          setActiveProduct('shelter');
          localStorage.setItem('paw_product', 'shelter');
        } catch { /* No shelter yet */ }
      } else {
        // Default: service provider
        try {
          const { data: prof } = await providerAPI.getProfile();
          setProvider(prof);
          setActiveProduct('service_provider');
          localStorage.setItem('paw_product', 'service_provider');
        } catch { /* No provider profile yet */ }
      }
    } catch {
      localStorage.removeItem('paw_token');
      localStorage.removeItem('paw_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('paw_token', data.token);
    localStorage.setItem('paw_user', JSON.stringify(data.user));
    setUser(data.user);

    const productType = data.user.product_type || localStorage.getItem('paw_product');

    if (productType === 'vet_clinic') {
      try {
        const { data: clinic } = await vetAPI.getClinic();
        setVetClinic(clinic);
        setActiveProduct('vet_clinic');
        localStorage.setItem('paw_product', 'vet_clinic');
      } catch { }
    } else if (productType === 'shelter') {
      try {
        const { data: sh } = await shelterAPI.getProfile();
        setShelter(sh);
        setActiveProduct('shelter');
        localStorage.setItem('paw_product', 'shelter');
      } catch { }
    } else {
      try {
        const { data: prof } = await providerAPI.getProfile();
        setProvider(prof);
        setActiveProduct('service_provider');
        localStorage.setItem('paw_product', 'service_provider');
      } catch { }
    }
    return data;
  };

  const register = async (email, password, fullName) => {
    const { data } = await authAPI.register({ email, password, full_name: fullName, role: 'provider' });
    localStorage.setItem('paw_token', data.token);
    localStorage.setItem('paw_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('paw_token');
    localStorage.removeItem('paw_user');
    localStorage.removeItem('paw_product');
    setUser(null);
    setProvider(null);
    setVetClinic(null);
    setShelter(null);
    setActiveProduct(null);
  };

  const refreshProvider = async () => {
    try {
      const { data: prof } = await providerAPI.getProfile();
      setProvider(prof);
      return prof;
    } catch { return null; }
  };

  const refreshVetClinic = async () => {
    try {
      const { data: clinic } = await vetAPI.getClinic();
      setVetClinic(clinic);
      setActiveProduct('vet_clinic');
      localStorage.setItem('paw_product', 'vet_clinic');
      return clinic;
    } catch { return null; }
  };

  const refreshShelter = async () => {
    try {
      const { data: sh } = await shelterAPI.getProfile();
      setShelter(sh);
      setActiveProduct('shelter');
      localStorage.setItem('paw_product', 'shelter');
      return sh;
    } catch { return null; }
  };

  const switchProduct = (product) => {
    setActiveProduct(product);
    localStorage.setItem('paw_product', product);
  };

  return (
    <AuthContext.Provider value={{
      user, provider, vetClinic, shelter, activeProduct, loading,
      login, register, logout,
      refreshProvider, refreshVetClinic, refreshShelter, switchProduct,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
