import jenkins.model.Jenkins
import hudson.security.GlobalMatrixAuthorizationStrategy
import hudson.security.FullControlOnceLoggedInAuthorizationStrategy
import org.jenkinsci.plugins.badge.actions.PublicBuildStatusAction
import org.jenkinsci.plugins.badge.extensionpoints.ParameterResolverExtensionPoint
import hudson.ExtensionList
import hudson.model.Actionable
import hudson.model.Job
import hudson.model.Run
import io.jenkins.plugins.coverage.metrics.steps.CoverageBuildAction
import io.jenkins.plugins.coverage.metrics.model.Baseline
import io.jenkins.plugins.coverage.metrics.model.ElementFormatter
import edu.hm.hafner.coverage.Metric

def instance = Jenkins.get()
// Preserve the existing policy for authenticated users, adding only badge access.
if (instance.authorizationStrategy instanceof FullControlOnceLoggedInAuthorizationStrategy) {
    def strategy = new GlobalMatrixAuthorizationStrategy()
    strategy.add(Jenkins.ADMINISTER, 'authenticated')
    strategy.add(PublicBuildStatusAction.VIEW_STATUS, 'anonymous')
    instance.authorizationStrategy = strategy
    instance.save()
}

// The standard coverage badge resolver selects only the first coverage action.
// Select each report explicitly so the frontend never displays backend coverage.
class SeparateCoverageResolver implements ParameterResolverExtensionPoint {
    @Override
    String resolve(Actionable target, String parameter) {
        def run = target instanceof Job ? target.lastBuild : target
        if (!(run instanceof Run) || parameter == null) {
            return parameter
        }
        def result = parameter
        ['backend', 'frontend'].each { reportId ->
            def action = run.getActions(CoverageBuildAction).find { it.id == reportId }
            def value = action?.statistics?.getValue(Baseline.PROJECT, Metric.LINE)?.orElse(null)
            def text = value == null ? 'unavailable' : new ElementFormatter().format(value)
            result = result.replace("${reportId}Lines".toString(), text)
        }
        return result
    }
}
ExtensionList.lookup(ParameterResolverExtensionPoint).add(new SeparateCoverageResolver())
