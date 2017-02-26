package org.sogive.data.charity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiPredicate;

import com.winterwell.utils.TodoException;
import com.winterwell.utils.Utils;
import com.winterwell.utils.containers.Containers;
import com.winterwell.utils.web.SimpleJson;

public class NGO extends Thing<NGO> {
	private static final long serialVersionUID = 1L;

	public NGO(String ourid) {
		put("@id", ourid);
	}

	public NGO() {
		
	}
	
	public void setTags(String tags) {
		put("tags", tags); // TODO split. Notes say & but not sure the data follows that
	}

	/**
	 * Name & year should be unique or it will merge.
	 * @param project
	 * @return 
	 */
	public List<Project> addProject(Project project) {		
		BiPredicate<Project,Project> matcher = (p1, p2) -> 
				Utils.equals(p1.getName(), p2.getName()) && Utils.equals(p1.getYear(), p2.getYear());
		List<Project> projects = addOrMerge("projects", project, matcher);
		return projects;
	}

	public List<Project> getProjects() {
		// TODO this is not good :(
		List ps = (List) get("projects");
		ps = getThings(ps, Project.class);
		put("projects", ps);
		return ps;
	}

	@Deprecated // TODO
	public static Project getRepProject(NGO charity) {
		List<Project> projects = charity.getProjects();
		throw new TodoException();
//		// Representative and ready for use?
//		List<Project> repProjects = Containers.filter(p -> (p.isRep && p.ready), projects);
//		
////		// Get most recent, if more than one
////		let repProject = repProjects.reduce((best, current) => {
////			return (best.year > current.year) ? best : current;
////		}, {year: 0});
//
//		// ...or fall back.
//		if ( ! repProject) {
//			repProject = _.find(ngo.projects, p => p.name === 'overall');
//		}
//
//		if (!repProject) {
//			repProject = ngo.projects && ngo.projects[0];
//		}
//
//		return repProject;
//
//		return null;
	}

}
