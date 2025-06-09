import { Navigation } from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyList } from '@/components/properties/PropertyList';
import { RegisterProperty } from '@/components/properties/RegisterProperty';

export default function PropertiesPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="container py-20">
        <h1 className="mb-8 text-3xl font-bold neon-text">Property Management</h1>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="list">My Properties</TabsTrigger>
            <TabsTrigger value="register">Register New</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-6">
            <PropertyList />
          </TabsContent>
          <TabsContent value="register" className="mt-6">
            <RegisterProperty />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
} 