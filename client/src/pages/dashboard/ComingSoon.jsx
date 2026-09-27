import Topbar from '../../components/layout/Topbar';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/Feedback';

export default function ComingSoon({ title, icon, description }) {
  return (
    <>
      <Topbar title={title} />
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardBody>
            <EmptyState
              icon={icon}
              title={`${title} is being built next`}
              description={
                description ||
                'This part of FlowForge is planned but not implemented yet in this build — no placeholder data or fake actions live here.'
              }
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
