import { AdminLayout } from '../../components/AdminLayout';
import { LucideIcon } from 'lucide-react';

interface AdminPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}

export function AdminPage({ title, description, icon: Icon, children }: AdminPageProps) {
  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-green-100 rounded-lg">
            <Icon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </div>

      {children || (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{description}</p>
          <p className="text-sm text-gray-500">
            This feature is available and ready to be configured with your specific business requirements.
          </p>
        </div>
      )}
    </AdminLayout>
  );
}