'use client';

import { PropertyList } from '@/components/properties/PropertyList';
import { RegisterProperty } from '@/components/properties/RegisterProperty';

export default function PropertiesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-8">Register New Property</h1>
          <RegisterProperty />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-8">Your Properties</h1>
          <PropertyList />
        </div>
      </div>
    </div>
  );
} 